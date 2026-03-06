import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        env[match[1]] = (match[2] || '').replace(/['"]/g, '');
    }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function updateTrigger() {
    const sql = `
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_gym_id uuid;
  err_context text;
begin
  begin
    insert into public.profiles (id, email, full_name, role, phone)
    values (
      new.id, 
      new.email, 
      coalesce(new.raw_user_meta_data->>'full_name', new.email),
      coalesce(new.raw_user_meta_data->>'role', 'gym_member'),
      new.raw_user_meta_data->>'phone'
    );
  exception when others then
    GET STACKED DIAGNOSTICS err_context = PG_EXCEPTION_CONTEXT;
    raise exception 'Error in profiles insert: % %', SQLERRM, err_context;
  end;

  if (new.raw_user_meta_data->>'role' = 'gym_master') then
    begin
      insert into public.gyms (name, owner_id, address, phone, business_registration_number)
      values (
        coalesce(new.raw_user_meta_data->>'gym_name', 'My Gym'),
        new.id,
        new.raw_user_meta_data->>'gym_address',
        new.raw_user_meta_data->>'gym_phone',
        new.raw_user_meta_data->>'business_registration_number'
      ) returning id into new_gym_id;
    exception when others then
      GET STACKED DIAGNOSTICS err_context = PG_EXCEPTION_CONTEXT;
      raise exception 'Error in gyms insert: % %', SQLERRM, err_context;
    end;
  end if;

  return new;
end;
$$ language plpgsql security definer;
  `;

    // We need to run this SQL using the supbase psql or via REST but REST doesn't allow raw SQL.
    // We can use a previously created RPC function if exists to run SQL.
    // Wait, does 'verify_rpc.js' or similar exist? Let's check `test_signup.mjs` first.
}
updateTrigger();
