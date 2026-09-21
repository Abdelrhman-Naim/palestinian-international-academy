const fs = require('fs');
const f = "src/utils/medical-robot.js";
let content = fs.readFileSync(f, 'utf8');

// Add import
content = content.replace(
  "import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';",
  "import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';\nimport { Timer } from 'three/addons/misc/Timer.js';"
);

// Replace variables
content = content.replace("let scene, camera, renderer, clock, pmrem, envRT;", "let scene, camera, renderer, timer, pmrem, envRT;");

// Replace instantiation
content = content.replace("clock = new THREE.Clock();", "timer = new Timer();");

// Replace getDelta (Timer uses update and getDelta is a method)
// Wait, Timer API is: timer.update(), then timer.getDelta()
content = content.replace(
  "const dt = Math.min(clock.getDelta(), 0.1);",
  "timer.update();\n    const dt = Math.min(timer.getDelta(), 0.1);"
);

content = content.replace(
  "else if (!rafId) { clock.getDelta(); animate(); }",
  "else if (!rafId) { timer.update(); animate(); }"
);

fs.writeFileSync(f, content, 'utf8');
