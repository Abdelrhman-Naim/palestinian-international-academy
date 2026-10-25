const https = require('https');

https.get('https://palestine-international-academy.vercel.app/?nocache=' + Date.now(), (res) => {
  console.log('Headers with nocache:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const titleMatch = data.match(/<title>([^<]+)<\/title>/);
    console.log('Title with nocache:', titleMatch ? titleMatch[1] : 'None');
    const canonMatch = data.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
    console.log('Canonical with nocache:', canonMatch ? canonMatch[1] : 'None');
  });
}).on('error', console.error);
