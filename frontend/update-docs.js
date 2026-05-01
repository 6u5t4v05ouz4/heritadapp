const fs = require('fs');
const files = [
  'C:\\Users\\migia\\Documents\\GitHub\\heritadapp\\frontend\\src\\app\\docs\\layout.tsx',
  'C:\\Users\\migia\\Documents\\GitHub\\heritadapp\\frontend\\src\\app\\docs\\page.tsx',
  'C:\\Users\\migia\\Documents\\GitHub\\heritadapp\\frontend\\src\\app\\docs\\heirs\\claim\\page.tsx',
  'C:\\Users\\migia\\Documents\\GitHub\\heritadapp\\frontend\\src\\app\\docs\\how-it-works\\page.tsx',
  'C:\\Users\\migia\\Documents\\GitHub\\heritadapp\\frontend\\src\\app\\docs\\security\\page.tsx',
  'C:\\Users\\migia\\Documents\\GitHub\\heritadapp\\frontend\\src\\app\\docs\\smart-contracts\\page.tsx',
  'C:\\Users\\migia\\Documents\\GitHub\\heritadapp\\frontend\\src\\app\\docs\\vaults\\create\\page.tsx',
  'C:\\Users\\migia\\Documents\\GitHub\\heritadapp\\frontend\\src\\app\\docs\\vaults\\manage\\page.tsx',
  'C:\\Users\\migia\\Documents\\GitHub\\heritadapp\\frontend\\src\\components\\docs\\DocCard.tsx',
  'C:\\Users\\migia\\Documents\\GitHub\\heritadapp\\frontend\\src\\components\\docs\\Sidebar.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Colors and Backgrounds
  newContent = newContent.replace(/bg-bg-base/g, 'bg-[#050505]');
  newContent = newContent.replace(/bg-bg-elevated\/30/g, 'bg-white/5');
  newContent = newContent.replace(/bg-bg-elevated\/50/g, 'bg-white/5');
  newContent = newContent.replace(/bg-bg-elevated/g, 'bg-white/10');
  
  newContent = newContent.replace(/text-text-primary/g, 'text-white');
  newContent = newContent.replace(/text-text-secondary/g, 'text-gray-400');
  newContent = newContent.replace(/text-text-tertiary/g, 'text-gray-500');
  
  newContent = newContent.replace(/text-accent-primary/g, 'text-[#D4AF37]');
  newContent = newContent.replace(/bg-accent-primary\/10/g, 'bg-[#D4AF37]/10');
  newContent = newContent.replace(/bg-accent-primary\/50/g, 'bg-[#D4AF37]/50');
  newContent = newContent.replace(/border-accent-primary\/50/g, 'border-[#D4AF37]/50');
  newContent = newContent.replace(/border-accent-primary/g, 'border-[#D4AF37]');
  
  newContent = newContent.replace(/border-border-subtle/g, 'border-white/10');
  
  // Headers typography enhancements
  // Match: className="text-3xl md:text-4xl font-bold text-white mb-6" (after text-text-primary is replaced)
  newContent = newContent.replace(/className="(text-[2-6]xl) (md:text-[2-6]xl )?font-bold text-white /g, 'className="$1 $2font-playfair font-bold text-white tracking-[0.05em] uppercase ');
  newContent = newContent.replace(/className="(text-lg|text-xl|text-2xl) font-semibold text-\[#D4AF37\] /g, 'className="$1 font-playfair font-bold text-[#D4AF37] uppercase tracking-wider ');

  // Prose
  if (file.includes('page.tsx')) {
    newContent = newContent.replace(/className="prose prose-invert max-w-none text-gray-400([^"]*)"/g, 'className="prose prose-invert max-w-none text-gray-400 prose-headings:font-playfair prose-headings:text-white prose-headings:font-bold prose-headings:tracking-wide prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-a:text-[#D4AF37] hover:prose-a:text-[#b08835] prose-a:transition-colors prose-strong:text-gray-200$1"');
  }

  // Active link in Sidebar
  if (file.includes('Sidebar.tsx')) {
    newContent = newContent.replace(/className="text-xs font-bold text-gray-500 mb-3 tracking-wider"/g, 'className="text-xs font-playfair font-bold text-gray-500 mb-3 tracking-widest uppercase"');
    newContent = newContent.replace(/text-gray-500 hover:text-white/g, 'text-gray-500 hover:text-[#D4AF37]'); // if text-text-primary was replaced by white
  }

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated ' + file);
  }
});
