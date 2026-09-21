const fs = require('fs');

let hero = fs.readFileSync('src/components/Hero.jsx', 'utf8');

// Replace background and add noise/glow elements
hero = hero.replace('<section className="bg-gradient-to-b from-white to-orange-50 dark:from-[#050505] dark:to-[#0a0a0a] text-gray-900 dark:text-white relative overflow-hidden pt-20 pb-32">',
'<section className="bg-white dark:bg-[#030303] text-gray-900 dark:text-white relative overflow-hidden pt-24 pb-32">\n        {/* Luxury Glow Effects */}\n        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>\n        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-500/10 dark:bg-amber-500/5 blur-[100px] rounded-full pointer-events-none"></div>');

// Make title much more elegant
hero = hero.replace('className="font-display-lg text-4xl md:text-6xl font-extrabold leading-tight"',
'className="font-display-lg text-5xl md:text-7xl font-extrabold leading-tight tracking-tight drop-shadow-sm"');

// Make subtitle elegant
hero = hero.replace('className="font-body-lg text-gray-600 dark:text-gray-300 max-w-xl text-lg"',
'className="font-body-lg text-gray-600 dark:text-gray-400 max-w-xl text-lg md:text-xl leading-relaxed font-light"');

// Make buttons premium
hero = hero.replace('className="bg-white dark:bg-black text-gray-900 dark:text-white font-label-caps px-6 py-3 rounded-lg font-bold hover:text-amber-300 cursor-pointer transition-transform active:scale-95 flex items-center gap-2"',
'className="bg-gradient-to-r from-primary to-amber-500 text-white font-label-caps px-8 py-4 rounded-xl font-bold hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] cursor-pointer transition-all duration-300 active:scale-95 flex items-center gap-2 relative overflow-hidden group"');

hero = hero.replace('{t("hero.cta1")}',
'<span className="relative z-10">{t("hero.cta1")}</span>\n                <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>');

hero = hero.replace('className="border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white font-label-caps px-6 py-3 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-[#0a0a0a] hover:text-gray-900 dark:text-white transition-colors text-center inline-block"',
'className="border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-white font-label-caps px-8 py-4 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300 text-center inline-block hover-lift"');

// Stats design
hero = hero.replace('<div className="flex gap-12 pt-8 border-t border-gray-200 dark:border-primary/20 mt-8 w-fit">',
'<div className="flex gap-12 pt-10 border-t border-gray-200 dark:border-gray-800/60 mt-10 w-fit backdrop-blur-sm">');

hero = hero.replace('<p className="font-stats-number text-4xl font-bold text-gray-900 dark:text-white">5</p>',
'<p className="font-stats-number text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tighter">5</p>');
hero = hero.replace('<p className="font-stats-number text-4xl font-bold text-gray-900 dark:text-white">2.4k</p>',
'<p className="font-stats-number text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tighter">2.4k</p>');
hero = hero.replace('<p className="font-stats-number text-4xl font-bold text-secondary">2%</p>',
'<p className="font-stats-number text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300 tracking-tighter">2%</p>');

// Robot container glow
hero = hero.replace("filter: 'drop-shadow(0 0 35px rgba(212, 175, 55, 0.35))'",
"filter: 'drop-shadow(0 20px 40px rgba(212, 175, 55, 0.4)) drop-shadow(0 0 100px rgba(212, 175, 55, 0.2))'");

// Marquee update
hero = hero.replace('className="bg-white dark:bg-black border-y border-gray-200 dark:border-primary/10 py-4 overflow-hidden relative"',
'className="bg-gray-50 dark:bg-[#070707] border-y border-gray-200/50 dark:border-white/5 py-6 overflow-hidden relative shadow-inner"');

fs.writeFileSync('src/components/Hero.jsx', hero);
console.log('Hero updated');
