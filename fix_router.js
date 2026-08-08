const fs = require('fs');
const path = require('path');

const portals = ['reception', 'patient', 'doctor', 'laboratory', 'pharmacy', 'billing', 'canteen'];

for (const portal of portals) {
  const filePath = path.join(__dirname, 'src/app', portal, 'layout.tsx');
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  const searchStr = `router.push('/${portal}/login');`;
  const replaceStr = `window.location.href = '/${portal}/login';`;
  
  if (content.includes(searchStr)) {
    content = content.replace(searchStr, replaceStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${portal}/layout.tsx`);
  }
}
