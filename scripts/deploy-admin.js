const { execSync } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');

// Load .env.local to get Supabase credentials
dotenv.config({ path: '.env.local' });

// Verify required env variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("Error: GITHUB_TOKEN is not set in .env.local");
  process.exit(1);
}

// Function to run a command and optionally return its output
function runCommand(command, silent = false) {
  if (!silent) console.log(`> ${command}`);
  try {
    return execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (error) {
    if (!silent) console.error(`Command failed: ${error.message}`);
    process.exit(1);
  }
}

console.log("🚀 Starting Admin App Deployment sequence...");

// 1. Commit and push current changes
console.log("\n📦 Committing and pushing local changes...");
try {
  runCommand('git add .');
  runCommand('git commit -m "chore: auto-deploy admin app update"');
  runCommand('git push origin main');
} catch (e) {
  console.log("No new changes to commit or push failed. Continuing...");
}

// 2. Trigger GitHub Actions Workflow for Member App using gh CLI
console.log("\n🏃 Triggering GitHub Action to build Android APK (type: admin)...");
runCommand('gh workflow run build-android.yml --ref main -f app_type=admin');

console.log("\n✅ Workflow triggered successfully!");
console.log("");
console.log("👉 Go to https://github.com/siam0933-sketch/jiujitsu-management/actions to monitor the build.");
console.log("Once complete, the new 'My_jiujitsu_Admin.apk' will be uploaded to Supabase Storage (KIOSK bucket) and available for download.");
