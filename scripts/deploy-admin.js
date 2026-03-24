const fs = require('fs');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

// 1. Get tokens
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'siam0933-sketch/jiujitsu-management';
const WORKFLOW_ID = 'build-android.yml';

if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN is not set in .env.local');
  process.exit(1);
}

// Helper for GitHub API
async function githubReq(endpoint, options = {}) {
  const url = `https://api.github.com/repos/${REPO}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API Error (${res.status}): ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function run() {
  console.log('🚀 [1/5] 관장 전용 앱(admin-APK) 최신 빌드를 요청합니다...');
  
  // 1. Trigger workflow for admin app
  await githubReq(`/actions/workflows/${WORKFLOW_ID}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref: 'main', inputs: { app_type: 'admin' } }),
  });
  
  console.log('⏳ [2/5] 빌드가 시작되었습니다. 깃허브 서버에서 완료될 때까지 대기합니다. (보통 3~5분 소요)...');
  
  // Wait a bit for the run to show up
  await new Promise(r => setTimeout(r, 10000));
  
  // 2. Poll for the latest run
  let runId = null;
  const runsRes = await githubReq(`/actions/workflows/${WORKFLOW_ID}/runs?per_page=1`);
  if (runsRes && runsRes.workflow_runs && runsRes.workflow_runs.length > 0) {
    runId = runsRes.workflow_runs[0].id;
  }
  
  if (!runId) throw new Error('방금 시작된 빌드를 찾을 수 없습니다.');
  
  console.log(`✅ 빌드 작업(#${runId}) 추적 시작!`);
  
  // Poll until complete
  let status = 'in_progress';
  let conclusion = null;
  while (status !== 'completed') {
    await new Promise(r => setTimeout(r, 15000));
    const runDetail = await githubReq(`/actions/runs/${runId}`);
    status = runDetail.status;
    conclusion = runDetail.conclusion;
    process.stdout.write('.');
  }
  console.log('');
  
  if (conclusion !== 'success') {
    throw new Error(`빌드 실패. 깃허브(Actions)에서 원인을 확인하세요. 사유: ${conclusion}`);
  }
  
  console.log('✅ [3/5] 빌드 성공! 결과물(APK)을 다운로드합니다...');
  
  // 3. Get artifacts
  const artifactsRes = await githubReq(`/actions/runs/${runId}/artifacts`);
  const artifact = artifactsRes.artifacts.find(a => a.name === 'admin-APK');
  
  if (!artifact) throw new Error('admin-APK 결과물을 찾을 수 없습니다.');
  
  // 4. Download artifact
  const downloadRes = await fetch(artifact.archive_download_url, {
    redirect: 'follow',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    }
  });
  
  if (!downloadRes.ok) throw new Error('결과물 다운로드 실패');
  
  const buffer = await downloadRes.arrayBuffer();
  fs.writeFileSync('admin-apk.zip', Buffer.from(buffer));
  
  console.log('📦 [4/5] 압축 해제 중...');
  try {
    execSync('tar -xf admin-apk.zip');
  } catch (e) {
    console.error('압축 해제 중 오류가 발생했습니다.', e);
  }
  
  if (!fs.existsSync('app-debug.apk')) {
    throw new Error('압축 속에서 app-debug.apk 파일을 찾지 못했습니다.');
  }
  
  console.log('☁️ [5/5] Supabase Storage에 업로드합니다...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const fileData = fs.readFileSync('app-debug.apk');
  const { error: uploadError } = await supabase.storage
    .from('KIOSK')
    .upload('admin-app.apk', fileData, {
      contentType: 'application/vnd.android.package-archive',
      upsert: true
    });
    
  if (uploadError) throw uploadError;
  
  console.log('🧹 임시 파일 청소 중...');
  try {
    fs.unlinkSync('admin-apk.zip');
    fs.unlinkSync('app-debug.apk');
  } catch (e) {}
  
  console.log('\n🎉 관장 전용 앱 빌드 및 업로드가 완료되었습니다!!');
  console.log('👉 랜딩 페이지의 [관장용 앱 다운로드] 버튼이 정상 동작합니다.');
}

run().catch(e => {
  console.error('\n❌ 작업 중 에러 발생:', e.message);
  process.exit(1);
});
