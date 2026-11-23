// Final verification: test with publishable key (what the app uses)
const url = 'https://mcbksvrhvnqqeyxrboup.supabase.co';
const publishableKey = 'sb_publishable_GIgGvlME7yS6goPqY8QByA_-__OwVZZ';

async function verify() {
  const accounts = [
    'omarzaryah@gmail.com',
    'omarzariah.dev@gmail.com'
  ];

  for (const email of accounts) {
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': publishableKey,
        'Authorization': `Bearer ${publishableKey}`,
      },
      body: JSON.stringify({ email, password: '1Billion$code0' })
    });
    const json = await res.json();
    if (res.status === 200) {
      console.log(email + ': SUCCESS ✓  (token starts with:', json.access_token?.substring(0, 30) + '...)');
    } else {
      console.log(email + ': FAIL -', json.msg);
    }
  }
}
verify().catch(console.error);
