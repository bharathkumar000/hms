const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = [
  'src/app/admin/appointments/page.tsx',
  'src/app/admin/departments/page.tsx',
  'src/app/admin/inventory/page.tsx',
  'src/app/admin/logs/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/doctor/consultations/page.tsx',
  'src/app/doctor/lab/page.tsx',
  'src/app/doctor/prescriptions/page.tsx',
  'src/app/doctor/schedule/page.tsx',
  'src/app/doctor/settings/page.tsx',
  'src/app/laboratory/settings/page.tsx',
  'src/app/patient/appointments/page.tsx',
  'src/app/pharmacy/billing/page.tsx',
  'src/app/pharmacy/inventory/page.tsx',
  'src/app/pharmacy/orders/page.tsx',
  'src/app/pharmacy/prescriptions/page.tsx',
  'src/app/pharmacy/settings/page.tsx',
  'src/app/pharmacy/suppliers/page.tsx',
  'src/app/reception/appointments/page.tsx',
  'src/app/reception/billing/page.tsx',
  'src/app/reception/patients/register/page.tsx',
  'src/app/reception/patients/page.tsx',
  'src/app/reception/queue/page.tsx',
  'src/app/reception/reports/page.tsx',
  'src/app/reception/settings/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Add import if not exists
  if (!content.includes('useModal')) {
    content = "import { useModal } from '@/components/ModalProvider';\n" + content;
  }

  // 2. Inject hook in the main component
  // Matches "export default function ComponentName() {" or similar
  const componentRegex = /export\s+default\s+function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{/;
  if (!content.includes('const { showAlert, showConfirm } = useModal();')) {
    content = content.replace(componentRegex, (match) => {
      return match + "\n  const { showAlert, showConfirm } = useModal();\n";
    });
  }

  // 3. Replace alert()
  content = content.replace(/alert\(/g, 'showAlert(');

  // 4. Replace confirm()
  // This is tricky for regex if it's inside if(!confirm()) 
  // e.g. "if (!confirm(" -> "if (!(await showConfirm("
  // e.g. "if (confirm(" -> "if (await showConfirm("
  // We'll just replace confirm( with await showConfirm(
  // Then we manually fix the async handlers for those few files!
  content = content.replace(/confirm\(/g, 'await showConfirm(');

  fs.writeFileSync(file, content);
  console.log('Processed', file);
}
