const fs = require('fs');
const path = require('path');

const portals = ['reception', 'patient', 'doctor', 'laboratory', 'pharmacy', 'billing', 'canteen', 'admin'];

for (const portal of portals) {
  const filePath = path.join(__dirname, 'src/app', portal, 'layout.tsx');
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove the early return for isAuthChecking
  const earlyReturnStr = `  if (isAuthChecking) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading Portal...</div>;
  }`;
  
  if (content.includes(earlyReturnStr)) {
    content = content.replace(earlyReturnStr, '');
  }

  // 2. Wrap the return statement
  // We need to find the main `return (` that comes after the hooks
  // and wrap it.
  
  // Find the LAST `return (` which is the main layout return.
  const returnIndex = content.lastIndexOf('return (');
  if (returnIndex !== -1) {
    const beforeReturn = content.substring(0, returnIndex);
    const afterReturn = content.substring(returnIndex + 'return ('.length);
    
    // We construct the new return
    const newReturn = `return (
    <>
      {isAuthChecking && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          Loading Portal...
        </div>
      )}
      <div style={{ display: isAuthChecking ? 'none' : 'block', height: '100vh' }}>
        `;
        
    // Now we need to append the `afterReturn`, but wait, we need to close the `</div></>` at the very end of the file.
    // The very end of the file should be `  );\n}`
    
    // Let's replace the final `  );\n}` with `      </div>\n    </>\n  );\n}`
    const finalContent = beforeReturn + newReturn + afterReturn;
    
    // Replace the last `);` before `}`
    const lastParenIndex = finalContent.lastIndexOf(');');
    if (lastParenIndex !== -1) {
      const finalBeforeParen = finalContent.substring(0, lastParenIndex);
      const finalAfterParen = finalContent.substring(lastParenIndex);
      
      const fixedContent = finalBeforeParen + '      </div>\n    </>\n  ' + finalAfterParen;
      
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`Fixed layout for ${portal}`);
    }
  }
}
