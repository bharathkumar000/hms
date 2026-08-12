'use client';
import { useEffect } from 'react';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Hospital,
  LayoutDashboard, 
  FileText, 
  Calculator, 
  CreditCard, 
  Undo2, 
  BarChart3, 
  LogOut,
  Bell,
  User
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

  useEffect(() => {
    if (pathname.endsWith('/login')) {
      return;
    }
    const cookieMatch = document.cookie.match(/(?:^|; )demo_auth=([^;]*)/);
    if (!cookieMatch || cookieMatch[1] !== 'billing') {
      window.location.href = '/billing/login';
    } else {
      }
  }, [pathname, router]);

  if (pathname.endsWith('/login')) {
    return <>{children}</>;
  }

  // Don't show sidebar on login page
  if (pathname === '/billing/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navGroups = [
    {
      items: [
        { name: 'Dashboard', path: '/billing/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Billing',
      items: [
        { name: 'Patient Bills', path: '/billing/generate', icon: Calculator },
        { name: 'Invoices', path: '/billing/invoices', icon: FileText },
      ]
    },
    {
      title: 'Payments',
      items: [
        { name: 'Payments History', path: '/billing/payments', icon: CreditCard },
        { name: 'Refunds', path: '/billing/refunds', icon: Undo2 },
      ]
    },
    {
      title: 'Finance',
      items: [
        { name: 'Financial Reports', path: '/billing/reports', icon: BarChart3 },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Notifications', path: '/billing/notifications', icon: Bell },
        { name: 'Profile', path: '/billing/profile', icon: User },
      ]
    }
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Hospital size={32} strokeWidth={2.5} />
          <span>HMS</span>
        </div>

        <nav className={styles.nav}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {group.title && <div className={styles.navGroup}>{group.title}</div>}
              {group.items.map((item) => {
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
            </div>
          ))}
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
