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

// Replace the Hero Graphic Area
const startIdx = content.indexOf('{/* Hero Graphic / Widget Area */}');
const endIdx = content.indexOf('</div>', content.indexOf('</div>', content.indexOf('</div>', content.indexOf('{/* Hero Graphic / Widget Area */}')) + 1) + 1) + 6;

if (startIdx !== -1 && endIdx !== -1 && !content.includes('ref={robotRef}')) {
  const newArea = 
\{/* Hero Graphic / Widget Area */}
          <div className="relative w-full h-[500px] flex items-center justify-center hidden lg:flex" style={{ perspective: '1000px' }}>
            <div ref={robotRef} className="w-full h-full absolute inset-0 z-10"></div>
            
            {/* Overlay Widgets */}
            <div className="absolute top-10 -right-4 bg-dark border border-gray-700 rounded-lg p-4 shadow-xl flex items-center gap-4 backdrop-blur-sm bg-opacity-90 z-20">
              <div className="w-12 h-12 rounded-full border-2 border-secondary flex items-center justify-center">
                <span className="font-label-caps text-secondary font-bold text-sm">86%</span>
              </div>
              <div>
                <p className="font-label-caps text-gray-400 text-[10px]">{t("hero.dailyEnergy")}</p>
                <p className="font-body-md text-white font-bold text-sm">{t("hero.streak")}</p>
              </div>
            </div>
            
            <div className="absolute bottom-10 -left-8 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl flex items-center gap-4 border border-gray-200 dark:border-gray-700 text-dark dark:text-white transition-colors z-20">
              <div className="bg-secondary/20 p-2 rounded-full text-secondary">
                <span className="material-symbols-outlined">workspace_premium</span>
              </div>
              <div>
                <p className="font-label-caps text-primary dark:text-secondary font-bold text-sm transition-colors">{t("hero.newBadge")}</p>
                <p className="font-body-md text-text-main dark:text-gray-300 text-sm transition-colors">{t("hero.fastLearner")}</p>
              </div>
            </div>
          </div>\;

  // Actually, we can use a regex to replace the entire div containing screenImg
  // Let's just manually replace the exact string to be safe.
}

fs.writeFileSync(f, content, 'utf8');
console.log("Done");
