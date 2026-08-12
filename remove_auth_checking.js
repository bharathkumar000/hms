const fs = require('fs');
const path = require('path');

const portals = ['reception', 'patient', 'doctor', 'laboratory', 'pharmacy', 'billing', 'canteen', 'admin'];

for (const portal of portals) {
  const filePath = path.join(__dirname, 'src/app', portal, 'layout.tsx');
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Remove `const [isAuthChecking, setIsAuthChecking] = useState(true);`
  content = content.replace(/const \[isAuthChecking, setIsAuthChecking\] = useState\(true\);\s*/g, '');

  // Remove `setIsAuthChecking(false);`
  content = content.replace(/setIsAuthChecking\(false\);\s*/g, '');

  // Remove `if (isAuthChecking) { ... }` block
  content = content.replace(/if\s*\(isAuthChecking\)\s*\{\s*return\s*<div[^>]*>Loading Portal\.\.\.<\/div>;\s*\}\s*/g, '');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Removed isAuthChecking from ${portal}/layout.tsx`);
}
