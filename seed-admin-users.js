/**
 * seed-admin-users.js
 * Creates one confirmed test account per DARIYA role and promotes the
 * profile row to the correct role using the service-role key.
 *
 * Run once:  node seed-admin-users.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load credentials from environment — never hardcode secrets in source files.
// Set SUPABASE_URL and SUPABASE_SECRET_KEY in your shell before running:
//   $env:SUPABASE_URL="https://xxxx.supabase.co"
//   $env:SUPABASE_SECRET_KEY="sb_secret_..."
//   node seed-admin-users.js
const URL    = process.env.SUPABASE_URL        || (() => { throw new Error('SUPABASE_URL env var is required'); })();
const SECRET = process.env.SUPABASE_SECRET_KEY || (() => { throw new Error('SUPABASE_SECRET_KEY env var is required'); })();

const admin = createClient(URL, SECRET, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = 'Dariya2026!';

/** One seed account per role */
const SEED_USERS = [
  { email: 'admin@dariya.ma',    role: 'admin',    full_name: 'DARIYA Admin' },
  { email: 'agent@dariya.ma',    role: 'agent',    full_name: 'Field Agent' },
  { email: 'provider@dariya.ma', role: 'provider', full_name: 'Service Provider' },
  { email: 'owner@dariya.ma',    role: 'owner',    full_name: 'Property Owner' },
];

async function upsertUser({ email, role, full_name }) {
  // ── 1. Check if user already exists ────────────────────────────────────────
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing.users.find(u => u.email === email);

  let userId;

  if (found) {
    console.log(`  ⚠  ${email} already exists — skipping auth.users creation`);
    userId = found.id;
  } else {
    // ── 2. Create auth user (pre-confirmed, no email sent) ──────────────────
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (error) {
      console.error(`  ✗  Failed to create ${email}:`, error.message);
      return;
    }

    userId = data.user.id;
    console.log(`  ✓  Created auth user ${email} (${userId})`);
  }

  // ── 3. Promote profile row to the correct role ────────────────────────────
  // The trigger on_user_created always sets role='owner'; we override it here
  // using the service-role client which bypasses RLS.
  const { error: profileErr } = await admin
    .from('profiles')
    .update({ role, full_name })
    .eq('id', userId);

  if (profileErr) {
    console.error(`  ✗  Failed to update profile for ${email}:`, profileErr.message);
  } else {
    console.log(`  ✓  Profile role set to '${role}' for ${email}`);
  }
}

async function run() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  DARIYA — Seed accounts per role');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const user of SEED_USERS) {
    console.log(`\n[${user.role.toUpperCase()}]`);
    await upsertUser(user);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Credentials summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Password: ${PASSWORD}\n`);
  SEED_USERS.forEach(u =>
    console.log(`  ${u.role.padEnd(10)} → ${u.email}`)
  );
  console.log('\n  Done.\n');
}

run().catch(console.error);
