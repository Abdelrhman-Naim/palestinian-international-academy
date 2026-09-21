const fs = require('fs');

const f = "src/components/Hero.jsx";
let content = fs.readFileSync(f, 'utf8');

const startIdx = content.indexOf('{/* Overlay Widgets */}');
const endIdx = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', content.indexOf('{/* Overlay Widgets */}')) + 1) + 1) + 6;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
}

// And replace the style of the robot container
content = content.replace("style={{ left: '50%', top: '50%', transform: 'translate(-50%, -45%)' }}",
  "style={{ left: '50%', top: '50%', transform: 'translate(-50%, -45%)', filter: 'drop-shadow(0 0 35px rgba(212, 175, 55, 0.35))' }}");

fs.writeFileSync(f, content, 'utf8');
