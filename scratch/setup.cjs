const fs = require('fs');
const path = require('path');

const ar = JSON.parse(fs.readFileSync('src/i18n/ar.json', 'utf8'));
const map = {};
// Prefer specific namespaces depending on the string, but here we just map reverse
for (const [ns, obj] of Object.entries(ar)) {
  for (const [k, v] of Object.entries(obj)) {
    map[v] = `${ns}.${k}`;
  }
}

// Write the script that can process a file
const script = `
const fs = require('fs');
const path = require('path');
const reverseMap = ${JSON.stringify(map, null, 2)};

const targetFiles = process.argv.slice(2);

for (const file of targetFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Add import if not present
  if (!content.includes('useLanguage')) {
    const isSubdir = file.includes('admin\\\\') || file.includes('admin/') || file.includes('student/') || file.includes('instructor/');
    const importPath = isSubdir ? '../../context/LanguageContext' : '../context/LanguageContext';
    
    // Find last import
    const lastImportIndex = content.lastIndexOf('import ');
    const nextLineIndex = content.indexOf('\\n', lastImportIndex);
    if (nextLineIndex !== -1) {
      content = content.slice(0, nextLineIndex + 1) + \`import { useLanguage } from '\${importPath}';\\n\` + content.slice(nextLineIndex + 1);
    } else {
      content = \`import { useLanguage } from '\${importPath}';\\n\` + content;
    }
  }

  // Add const { t, dir } = useLanguage(); inside the component
  // Find component definition: const MyComponent = () => { or function MyComponent() {
  const compRegex = /(?:const\\s+\\w+\\s*=\\s*\\([^)]*\\)\\s*=>\\s*{|function\\s+\\w+\\s*\\([^)]*\\)\\s*{)/;
  const match = content.match(compRegex);
  if (match) {
    if (!content.includes('useLanguage()')) {
      const insertionPoint = match.index + match[0].length;
      content = content.slice(0, insertionPoint) + '\\n  const { t, dir } = useLanguage();' + content.slice(insertionPoint);
    }
  }

  // Replace dir="rtl" with dir={dir}
  content = content.replace(/dir="rtl"/g, 'dir={dir}');

  // Now replace all strings.
  // We need to be careful with JSX text vs Attributes
  const sortedKeys = Object.keys(reverseMap).sort((a, b) => b.length - a.length);
  
  for (const arText of sortedKeys) {
    if (arText.trim() === '') continue;
    const key = reverseMap[arText];
    
    // 1. Replace >ArabicText< with >{t('key')}<
    const jsxRegex = new RegExp('>' + escapeRegExp(arText) + '\\\\s*<', 'g');
    content = content.replace(jsxRegex, '>{t(\\'' + key + '\\')}<');
    
    // 2. Replace placeholder="ArabicText" with placeholder={t('key')}
    const attrRegex = new RegExp('([a-zA-Z]+)="(' + escapeRegExp(arText) + ')"', 'g');
    content = content.replace(attrRegex, (match, p1, p2) => {
      return p1 + '={t(\\'' + key + '\\')}';
    });
    
    // 3. Replace >ArabicText with >{t('key')}
    // 4. Replace ArabicText< with {t('key')}<
    // Using a more generic approach: match the text outside tags, but it's tricky.
    // Let's just do generic replace for JSX if it's not inside quotes
    const genericJsxRegex = new RegExp('(?<=>[^<]*)' + escapeRegExp(arText) + '(?=[^>]*<)', 'g');
    content = content.replace(genericJsxRegex, '{t(\\'' + key + '\\')}');
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Modified', file);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^$\{}()|[\\]\\\\]/g, '\\\\$&');
}
`;

fs.writeFileSync('scratch/process.js', script);
