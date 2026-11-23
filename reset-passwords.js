// Load credentials from environment — never hardcode secrets in source files.
// Set SUPABASE_URL and SUPABASE_SECRET_KEY in your shell before running:
//   $env:SUPABASE_URL="https://xxxx.supabase.co"
//   $env:SUPABASE_SECRET_KEY="sb_secret_..."
//   node reset-passwords.js
const { createClient } = require('@supabase/supabase-js');
const url    = process.env.SUPABASE_URL    || (() => { throw new Error('SUPABASE_URL env var is required'); })();
const secret = process.env.SUPABASE_SECRET_KEY || (() => { throw new Error('SUPABASE_SECRET_KEY env var is required'); })();
const admin  = createClient(url, secret);

const PASSWORD = '1Billion$code0';

async function run() {
  // List all users
  const { data: { users } } = await admin.auth.admin.listUsers();
  console.log('All users:');
  users.forEach(u => console.log(' -', u.email, '| id:', u.id, '| confirmed:', !!u.email_confirmed_at));

  // Reset password for each user
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

  // Now test sign-in via REST
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
