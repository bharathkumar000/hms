import Link from 'next/link';
import { use } from 'react';

export default function LoginPage({ params }: { params: Promise<{ module: string }> }) {
  const resolvedParams = use(params);
  const portalName = resolvedParams.module.charAt(0).toUpperCase() + resolvedParams.module.slice(1);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-background)' }}>
      <h1 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>{portalName} Portal Login</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>This is a placeholder page for the {portalName} portal login.</p>
      <Link href="/" style={{ color: '#fff', backgroundColor: 'var(--color-primary)', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
        ← Back to Modules
      </Link>
    </div>
  );
}
