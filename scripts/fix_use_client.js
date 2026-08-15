const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('src/app', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file starts with import and has 'use client' later
    if (content.startsWith("import { useModal }") && content.includes("'use client'")) {
      // Remove both variants of 'use client' and "use client"
      content = content.replace(/'use client';?\r?\n?/g, '');
      content = content.replace(/"use client";?\r?\n?/g, '');
      
      // Prepend 'use client'
      content = "'use client';\n" + content;
      
      fs.writeFileSync(filePath, content);
      console.log('Fixed:', filePath);
    }
  }
});
