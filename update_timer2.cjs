const fs = require('fs');
const f = "src/utils/medical-robot.js";
let content = fs.readFileSync(f, 'utf8');

// Remove Timer import
content = content.replace(
  "import { Timer } from 'three/addons/misc/Timer.js';",
  ""
);

// Replace timer variable with lastTime
content = content.replace("let scene, camera, renderer, timer, pmrem, envRT;", "let scene, camera, renderer, lastTime, pmrem, envRT;");

// Initialize lastTime instead of timer
content = content.replace("timer = new Timer();", "lastTime = performance.now();");

// Calculate delta time
content = content.replace(
  "timer.update();\n    const dt = Math.min(timer.getDelta(), 0.1);",
  "const now = performance.now();\n    const dt = Math.min((now - lastTime) / 1000, 0.1);\n    lastTime = now;"
);

// Update visibility change logic
content = content.replace(
  "else if (!rafId) { timer.update(); animate(); }",
  "else if (!rafId) { lastTime = performance.now(); animate(); }"
);

fs.writeFileSync(f, content, 'utf8');
