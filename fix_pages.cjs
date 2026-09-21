const fs = require('fs');

let c = fs.readFileSync('src/pages/Courses.jsx', 'utf8');
c = c.replace(/className=\{\\ \\ flex flex-col font-alexandria bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 antialiased overflow-x-hidden\\\}/g, 
"className={\ flex flex-col font-alexandria bg-white dark:bg-black text-gray-900 dark:text-gray-100 antialiased overflow-x-hidden}");
// also fix button interpolation
c = c.replace(/className=\{\\ \\ w-full flex items-center/g, "className={w-full flex items-center");
c = c.replace(/className=\{\\ \\ w-full text-right/g, "className={w-full text-right");
c = c.replace(/className=\{\\ \\ w-full text-center/g, "className={w-full text-center");
c = c.replace(/\\\} onClick/g, "} onClick");
c = c.replace(/'\}\/g, "'} onClick"); // just in case
c = c.replace(/overflow-x-hidden\\\}/g, "overflow-x-hidden}");

c = c.replace(/className=\{\\w-full flex items-center/g, "className={w-full flex items-center");
c = c.replace(/className=\{\\w-full text-right/g, "className={w-full text-right");
c = c.replace(/className=\{\\w-full text-center/g, "className={w-full text-center");

// I'll just use a regex for all classname interpolations that broke:
c = c.replace(/className=\{\\ /g, "className={");
c = c.replace(/className=\{\\/g, "className={");
c = c.replace(/\\\}/g, "}");

fs.writeFileSync('src/pages/Courses.jsx', c);

let l = fs.readFileSync('src/pages/Library.jsx', 'utf8');
l = l.replace(/className=\{\\ /g, "className={");
l = l.replace(/className=\{\\/g, "className={");
l = l.replace(/\\\}/g, "}");
fs.writeFileSync('src/pages/Library.jsx', l);

console.log('Fixed');
