const fs = require('fs');

const f = "src/components/Hero.jsx";
let content = fs.readFileSync(f, 'utf8');

// Add imports
if (!content.includes('createMedicalRobot')) {
  content = content.replace("import { useLanguage } from '../context/LanguageContext';", 
    "import { useLanguage } from '../context/LanguageContext';\nimport { useEffect, useRef } from 'react';\nimport { createMedicalRobot } from '../utils/medical-robot.js';");
}

// Add ref and useEffect
if (!content.includes('robotRef')) {
  content = content.replace("const { t, dir } = useLanguage();", 
    "const { t, dir } = useLanguage();\n  const robotRef = useRef(null);\n\n  useEffect(() => {\n    if (!robotRef.current) return;\n    const bot = createMedicalRobot(robotRef.current, {\n      maxPixelRatio: 2,\n      responsiveness: 1,\n      idleAmplitude: 1,\n      trackWindow: true\n    });\n    return () => bot.dispose();\n  }, []);");
}

// Reorder text section for mobile (order-2 lg:order-1)
content = content.replace('<div className="space-y-8">', '<div className="space-y-8 order-2 lg:order-1 mt-8 lg:mt-0">');

// Replace Hero Graphic Area with robot and order-1 lg:order-2
const startIdx = content.indexOf('{/* Hero Graphic / Widget Area */}');
const endIdx = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', content.indexOf('{/* Hero Graphic / Widget Area */}')) + 1) + 1) + 6;

if (startIdx !== -1 && endIdx !== -1 && !content.includes('ref={robotRef}')) {
  // we remove everything from startIdx to endIdx and insert the robot
  const robotDiv = \{/* Hero Graphic / Widget Area */}
          <div className="relative w-full h-[400px] lg:h-[500px] flex items-center justify-center order-1 lg:order-2" style={{ perspective: '1000px' }}>
            <div ref={robotRef} className="w-full max-w-[520px] h-[500px] lg:h-[660px] absolute z-10 pointer-events-none" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -45%)', filter: 'drop-shadow(0 0 35px rgba(212, 175, 55, 0.35))' }}></div>
          </div>\`;
  content = content.substring(0, startIdx) + eval(robotDiv) + content.substring(endIdx);
}

fs.writeFileSync(f, content, 'utf8');
console.log("Done");
