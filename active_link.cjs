const fs = require('fs');

const f = "src/components/Navbar.jsx";
let content = fs.readFileSync(f, 'utf8');

if (!content.includes('useLocation')) {
  content = content.replace("import { Link, useNavigate }", "import { Link, useNavigate, useLocation }");
}

if (!content.includes('const location = useLocation();')) {
  content = content.replace("const navigate = useNavigate();", "const navigate = useNavigate();\n  const location = useLocation();");
}

const linkRegex = /<Link to="(\/[a-z]+)" className="([^"]+)"/g;
content = content.replace(linkRegex, (match, path, className) => {
  if (className.includes('text-text-main')) {
    const baseClass = className.replace('text-text-main dark:text-white hover:text-primary', '').trim();
    return `<Link to="${path}" className={\`${baseClass} \${location.pathname.startsWith('${path}') ? 'text-primary' : 'text-text-main dark:text-white hover:text-primary'}\`}`;
  }
  return match;
});

fs.writeFileSync(f, content, 'utf8');
console.log("Done");
