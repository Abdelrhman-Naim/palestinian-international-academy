const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = getFiles('src/pages');
const targetFiles = files.filter(f => !f.includes('NotFound.jsx')); // already done
execSync('node scratch/process.cjs ' + targetFiles.map(f => `"${f}"`).join(' '), {stdio: 'inherit'});
