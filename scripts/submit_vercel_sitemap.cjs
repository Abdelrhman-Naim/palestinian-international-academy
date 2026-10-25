const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  keyFile: 'C:/Users/Abood/.gemini/credentials/gsc-service-account.json',
  scopes: ['https://www.googleapis.com/auth/webmasters']
});

async function run() {
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  const res = await searchconsole.sitemaps.submit({
    siteUrl: 'https://palestine-international-academy.vercel.app/',
    feedpath: 'https://palestine-international-academy.vercel.app/sitemap.xml'
  });
  console.log('Vercel sitemap submitted to Google API:', res.status, res.statusText);
}

run().catch(console.error);
