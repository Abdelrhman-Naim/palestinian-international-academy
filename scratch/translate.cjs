const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) {
      results = results.concat(getFiles(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const ar = JSON.parse(fs.readFileSync('src/i18n/ar.json', 'utf8'));
// Create reverse map: "text" -> "key"
const textToKey = {};
for(const k1 in ar) {
  for(const k2 in ar[k1]) {
    textToKey[ar[k1][k2].trim()] = `${k1}.${k2}`;
  }
}

// Order by longest text first to avoid partial matches if they occur
const sortedTexts = Object.keys(textToKey).sort((a,b) => b.length - a.length);

const files = getFiles('src/pages');
files.push('src/App.jsx'); // App.jsx requested

files.forEach(f => {
  if (f.includes('NotFound.jsx')) return; // Already fine
  let c = fs.readFileSync(f, 'utf8');
  let orig = c;

  // Add import and hook
  if (!c.includes('useLanguage')) {
    const isSubdir = f.includes('admin\\\\') || f.includes('admin/') || f.includes('student/') || f.includes('instructor/');
    // App.jsx is at root
    const isRoot = f === 'src/App.jsx' || f === 'src\\\\App.jsx';
    const importPath = isRoot ? './context/LanguageContext' : (isSubdir ? '../../context/LanguageContext' : '../context/LanguageContext');
    
    const lastImportIndex = c.lastIndexOf('import ');
    const nextLineIndex = c.indexOf('\n', lastImportIndex);
    if (nextLineIndex !== -1) {
      c = c.slice(0, nextLineIndex + 1) + `import { useLanguage } from '${importPath}';\n` + c.slice(nextLineIndex + 1);
    } else {
      c = `import { useLanguage } from '${importPath}';\n` + c;
    }
  }

  // Insert const { t, dir } = useLanguage();
  const compRegex = /(?:const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{|function\s+\w+\s*\([^)]*\)\s*{|export\s+default\s+function\s+\w+\s*\([^)]*\)\s*{)/g;
  let match;
  let insertions = [];
  while ((match = compRegex.exec(c)) !== null) {
    insertions.push({ index: match.index + match[0].length });
  }
  
  // Apply insertions from back to front to preserve indices
  for (let i = insertions.length - 1; i >= 0; i--) {
    const ins = insertions[i].index;
    // Check if it already has it
    const lookahead = c.slice(ins, ins + 100);
    if (!lookahead.includes('useLanguage()')) {
      c = c.slice(0, ins) + '\n  const { t, dir } = useLanguage();' + c.slice(ins);
    }
  }

  // Replace dir="rtl" with dir={dir}
  c = c.replace(/dir="rtl"/g, 'dir={dir}');

  // Replace JSX Text: >...<
  c = c.replace(/>([^<]+)</g, (m, p1) => {
    let text = p1;
    // For each sorted text, if text includes it, we replace it ONLY if we replace the whole text (trimmed)
    // Or if it's exact match. Let's do exact match after trim.
    let trimmed = text.trim();
    if (textToKey[trimmed]) {
      const key = textToKey[trimmed];
      return m.replace(trimmed, `{t('${key}')}`);
    }
    
    // Sometimes text might have a space in the middle, or it might be partial.
    // E.g. `بواسطة {student}`. We shouldn't replace substrings blindly unless it's safe.
    // Let's iterate all known Arabic strings and if they appear, and it's not part of another word, replace it.
    for (const arText of sortedTexts) {
      if (text.includes(arText)) {
        // Only replace if it's surrounded by whitespace, quotes, or ends of the string
        // To avoid replacing "من" inside "عبدالرحمن"
        const regex = new RegExp(`(^|\\s|[.,!؟؛:])${escapeRegExp(arText)}($|\\s|[.,!؟؛:])`, 'g');
        if (regex.test(text)) {
          text = text.replace(regex, `$1{t('${textToKey[arText]}')}$2`);
        }
      }
    }
    return `>${text}<`;
  });

  // Replace Attributes: ="..."
  c = c.replace(/="([^"]+)"/g, (m, p1) => {
    let trimmed = p1.trim();
    if (textToKey[trimmed]) {
      return `={t('${textToKey[trimmed]}')}`;
    }
    // E.g. "مثال: تطوير الويب"
    for (const arText of sortedTexts) {
      if (p1 === arText) {
        return `={t('${textToKey[arText]}')}`;
      }
    }
    return m;
  });

  // Replace Ternary or Alert string literals: '...'
  c = c.replace(/'([^']+)'/g, (m, p1) => {
    let trimmed = p1.trim();
    if (textToKey[trimmed]) {
      // Return t('key') directly, so in ternary it becomes t('key') instead of 'text'
      // But wait! This might be an import path! E.g. import from '../context'.
      // They don't have Arabic text.
      return `t('${textToKey[trimmed]}')`;
    }
    return m;
  });

  if (c !== orig) {
    fs.writeFileSync(f, c, 'utf8');
    console.log('Processed', f);
  }
});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
