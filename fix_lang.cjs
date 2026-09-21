const fs = require('fs');

const files = ["src/pages/AdminDashboard.jsx", "src/pages/InstructorDashboard.jsx", "src/pages/Dashboard.jsx"];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/title=\{lang === 'ar' \? 'English' : '.*?'\}/, "title={lang === 'ar' ? 'English' : 'عربي'}");
  
  // also ensure toggleLang and lang are extracted from useLanguage
  if (!content.includes('toggleLang')) {
    content = content.replace(/const \{ t, dir \} = useLanguage\(\);/, "const { t, dir, toggleLang, lang } = useLanguage();");
  } else {
    // maybe it is already extracted? Let's replace anyway
    content = content.replace(/const \{ t, dir \} = useLanguage\(\);/, "const { t, dir, toggleLang, lang } = useLanguage();");
  }
  
  fs.writeFileSync(f, content, 'utf8');
});
console.log("Done");
