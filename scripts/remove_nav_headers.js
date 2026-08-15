const fs = require('fs');
const path = require('path');

const layouts = [
  'src/app/admin/layout.tsx',
  'src/app/doctor/layout.tsx',
  'src/app/laboratory/layout.tsx',
  'src/app/patient/layout.tsx',
  'src/app/pharmacy/layout.tsx',
  'src/app/reception/layout.tsx'
];

for (const layout of layouts) {
  if (fs.existsSync(layout)) {
    let content = fs.readFileSync(layout, 'utf8');
    // Remove lines that have <div className={styles.navGroup}>...</div>
    const regex = /.*<div className=\{styles\.navGroup\}>.*<\/div>.*\n/g;
    content = content.replace(regex, '');
    fs.writeFileSync(layout, content);
    console.log(`Processed ${layout}`);
  }
}
