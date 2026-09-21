const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = [...walk('src/components'), ...walk('src/pages')];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Fix Hero
    content = content.replace('bg-gradient-to-b from-black to-[#0a0a0a] text-white', 'bg-gradient-to-b from-white to-orange-50 dark:from-[#050505] dark:to-[#0a0a0a] text-gray-900 dark:text-white');
    content = content.replace('bg-black border-y border-primary/10', 'bg-white dark:bg-black border-y border-gray-200 dark:border-primary/10');
    
    // Fix Footer
    content = content.replace('bg-[#050505] border-t border-primary/20', 'bg-gray-50 dark:bg-[#050505] border-t border-gray-200 dark:border-primary/20');
    
    // Fix generic
    content = content.replace(/bg-black/g, 'bg-white dark:bg-black');
    content = content.replace(/bg-\[\#0a0a0a\]/g, 'bg-gray-50 dark:bg-[#0a0a0a]');
    content = content.replace(/bg-\[\#111\]/g, 'bg-gray-100 dark:bg-[#111]');
    
    // Deduplicate if we created bg-white dark:bg-white dark:bg-black
    content = content.replace(/bg-white dark:bg-white dark:bg-black/g, 'bg-white dark:bg-black');
    content = content.replace(/bg-white dark:bg-gray-50 dark:bg-\[\#0a0a0a\]/g, 'bg-white dark:bg-[#0a0a0a]');
    
    // Fix text colors in Hero
    content = content.replace(/text-white/g, 'text-gray-900 dark:text-white');
    content = content.replace(/text-gray-900 dark:text-gray-900 dark:text-white/g, 'text-gray-900 dark:text-white');
    content = content.replace(/text-gray-400/g, 'text-gray-600 dark:text-gray-300');

    fs.writeFileSync(f, content, 'utf8');
});
console.log('Fixed Light Mode');
