const fs = require('fs');
const path = require('path');
function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) results = results.concat(getFiles(file));
    else if (file.endsWith('.jsx')) results.push(file);
  });
  return results;
}
const ar = JSON.parse(fs.readFileSync('src/i18n/ar.json', 'utf8'));
const map = {};
for(const k1 in ar) {
  for(const k2 in ar[k1]) {
    map[`${k1}.${k2}`] = ar[k1][k2];
  }
}
const files = getFiles('src/pages');
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let orig = c;
  
  // Restore all {t('key')} -> text
  c = c.replace(/\{t\('([^']+)'\)\}/g, (m, p1) => {
    return map[p1] || m;
  });
  // Restore t('key') -> text (like in ternary)
  c = c.replace(/t\('([^']+)'\)/g, (m, p1) => {
    return `'${map[p1] || m}'`;
  });
  
  // Restore t("key")
  c = c.replace(/t\("([^"]+)"\)/g, (m, p1) => {
    return `"${map[p1] || m}"`;
  });

  // For the import and const { t, dir } = useLanguage();
  c = c.replace(/import \{ useLanguage \} from '[^']+';\r?\n/g, '');
  c = c.replace(/\s*const \{ t, dir \} = useLanguage\(\);\r?\n/g, '\n');
  c = c.replace(/dir=\{dir\}/g, 'dir="rtl"');

  if(c !== orig) {
    fs.writeFileSync(f, c);
    console.log('Restored', f);
  }
});
