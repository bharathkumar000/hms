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

  // Find the mis-placed useState
  const misplacedHook = "const [loading, setLoading] = useState(false);";
  
  if (content.includes(misplacedHook)) {
    // Remove it from its current location
    content = content.replace(misplacedHook, "");
    
    // Put it back right after supabase
    const supabaseClientLine = 'const supabase = createClient();';
    if (content.includes(supabaseClientLine)) {
      content = content.replace(supabaseClientLine, supabaseClientLine + '\n  ' + misplacedHook);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed hook placement in ${portal}/layout.tsx`);
    } else {
      console.log(`Could not find supabase line in ${portal}/layout.tsx`);
    }
  } else {
    console.log(`${portal}/layout.tsx does not have the misplaced hook`);
  }
}
