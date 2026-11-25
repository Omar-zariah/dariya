/**
 * reset-passwords.js  —  DARIYA dev utility
 *
 * Resets all Supabase Auth user passwords to the shared test password
 * and verifies sign-in works via REST.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_URL       = "https://<project-ref>.supabase.co"
 *   $env:SUPABASE_SECRET_KEY = "<service-role-key>"
 *   node reset-passwords.js
 *
 * NEVER hardcode credentials here. Always load from environment variables.
 */

const { createClient } = require('@supabase/supabase-js');

const url    = process.env.SUPABASE_URL        || (() => { throw new Error('Set SUPABASE_URL env var before running.'); })();
const secret = process.env.SUPABASE_SECRET_KEY || (() => { throw new Error('Set SUPABASE_SECRET_KEY env var before running.'); })();

const admin = createClient(url, secret);

const PASSWORD = '1Billion$code0';

async function run() {
  const { data: { users } } = await admin.auth.admin.listUsers();
  console.log('All users:');
  users.forEach(u => console.log(' -', u.email, '| id:', u.id, '| confirmed:', !!u.email_confirmed_at));

  for (const user of users) {
    const res = await admin.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true
    });
    if (res.error) {
      console.log('ERROR resetting password for', user.email, ':', res.error.message);
    } else {
      console.log('Password reset OK for', user.email);
    }
  }

  console.log('\n=== Testing sign-in via REST after password reset ===');
  for (const user of users) {
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': secret,
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({ email: user.email, password: PASSWORD })
    });
    const json = await res.json();
    console.log(user.email + ':', res.status === 200 ? 'SUCCESS ✓' : 'FAIL - ' + json.msg);
  }
}

run().catch(console.error);
