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

  // Fix imports
  if (!content.includes('useEffect')) {
    if (content.includes("import { useState } from 'react';")) {
      content = content.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';");
    } else {
      content = content.replace(/import .* from 'react';/, (match) => {
        if (match.includes('useState')) {
          return match.replace('useState', 'useState, useEffect');
        } else {
          return match.replace('{', '{ useEffect,');
        }
      });
      if (!content.includes('useEffect')) {
         content = "import { useEffect } from 'react';\n" + content;
      }
    }
  }

  // Insert Auth Checking state
  if (!content.includes('isAuthChecking')) {
    const searchString = 'const supabase = createClient();';
    const insertionIndex = content.indexOf(searchString);
    
    if (insertionIndex !== -1) {
      const splitIndex = insertionIndex + searchString.length;
      
      const authLogic = `
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    if (pathname.endsWith('/login')) {
      setIsAuthChecking(false);
      return;
    }
    const cookieMatch = document.cookie.match(/(?:^|; )demo_auth=([^;]*)/);
    if (!cookieMatch || cookieMatch[1] !== '${portal}') {
      router.push('/${portal}/login');
    } else {
      setIsAuthChecking(false);
    }
  }, [pathname, router]);

  if (pathname.endsWith('/login')) {
    return <>{children}</>;
  }

  if (isAuthChecking) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading Portal...</div>;
  }
`;
      content = content.slice(0, splitIndex) + '\n' + authLogic + content.slice(splitIndex);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${portal}/layout.tsx`);
    } else {
      console.log(`Could not find insertion point for ${portal}`);
    }
  } else {
    console.log(`${portal}/layout.tsx already updated`);
  }
}
