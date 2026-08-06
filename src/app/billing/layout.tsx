'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Receipt, 
  LayoutDashboard, 
  FileText, 
  Calculator, 
  CreditCard, 
  Undo2, 
  BarChart3, 
  LogOut
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './layout.module.css';

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Don't show sidebar on login page
  if (pathname === '/billing/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/billing/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', path: '/billing/invoices', icon: FileText },
    { name: 'Generate Bill', path: '/billing/generate', icon: Calculator },
    { name: 'Payments', path: '/billing/payments', icon: CreditCard },
    { name: 'Refunds', path: '/billing/refunds', icon: Undo2 },
    { name: 'Reports', path: '/billing/reports', icon: BarChart3 },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Receipt size={32} />
          <span>HMS Billing</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
