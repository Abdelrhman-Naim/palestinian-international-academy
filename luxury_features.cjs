const fs = require('fs');

let features = fs.readFileSync('src/components/Features.jsx', 'utf8');

// Upgrade feature cards to look glassy and premium
features = features.replace(/className="bg-white dark:bg-black p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-primary\/20/g,
'className="bg-white/80 dark:bg-white/5 backdrop-blur-lg p-10 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200/60 dark:border-white/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 relative overflow-hidden group');

// Upgrade feature icons
features = features.replace(/className="w-14 h-14 bg-amber-50 dark:bg-\[\#0a0a0a\] rounded-xl flex items-center justify-center mb-6 text-primary"/g,
'className="w-16 h-16 bg-gradient-to-br from-amber-50 to-white dark:from-white/10 dark:to-transparent rounded-2xl flex items-center justify-center mb-8 text-primary shadow-inner border border-amber-100 dark:border-white/10 group-hover:scale-110 transition-transform duration-500"');

// Enhance titles
features = features.replace(/className="font-headline-md text-xl font-bold mb-3 text-gray-900 dark:text-white"/g,
'className="font-headline-md text-2xl font-bold mb-4 text-gray-900 dark:text-white tracking-tight"');

// Background of section
features = features.replace('className="py-24 bg-gray-50 dark:bg-[#0a0a0a]"',
'className="py-32 bg-gray-50/50 dark:bg-[#050505] relative"');

fs.writeFileSync('src/components/Features.jsx', features);
console.log('Features updated');
