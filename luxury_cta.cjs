const fs = require('fs');

let cta = fs.readFileSync('src/components/CTA.jsx', 'utf8');

cta = cta.replace('className="py-24 bg-primary relative overflow-hidden"',
'className="py-32 bg-gradient-to-br from-[#111] to-black relative overflow-hidden"');

// Replace dark text with gold text where needed or white text
cta = cta.replace('className="text-center relative z-10 max-w-3xl mx-auto px-4"',
'className="text-center relative z-10 max-w-4xl mx-auto px-4"');

cta = cta.replace('className="font-display-lg text-4xl md:text-5xl font-extrabold text-gray-900 mb-6"',
'className="font-display-lg text-5xl md:text-6xl font-extrabold text-white mb-8 tracking-tight drop-shadow-lg"');

cta = cta.replace('className="font-body-lg text-xl text-gray-800 mb-10"',
'className="font-body-lg text-xl text-gray-300 mb-12 font-light leading-relaxed"');

cta = cta.replace('className="bg-gray-900 text-white font-label-caps px-8 py-4 rounded-lg font-bold hover:bg-black transition-transform active:scale-95 inline-flex items-center gap-2"',
'className="bg-gradient-to-r from-primary to-amber-500 text-white font-label-caps px-10 py-5 rounded-2xl font-bold hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] transition-all duration-300 active:scale-95 inline-flex items-center gap-2"');

fs.writeFileSync('src/components/CTA.jsx', cta);
console.log('CTA updated');
