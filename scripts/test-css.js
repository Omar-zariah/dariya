async function check() {
  const res = await fetch('http://localhost:3000');
  const text = await res.text();
  const cssMatch = text.match(/href="([^"]+\.css[^"]*)"/);
  console.log('CSS match:', cssMatch ? cssMatch[1] : 'NONE');
  if (cssMatch) {
    const cssRes = await fetch('http://localhost:3000' + cssMatch[1]);
    console.log('CSS fetch status:', cssRes.status, 'content-type:', cssRes.headers.get('content-type'));
    const cssBody = await cssRes.text();
    console.log('CSS body length:', cssBody.length);
    console.log('CSS snippet:', cssBody.substring(0, 150));
  }
}
check().catch(console.error);
