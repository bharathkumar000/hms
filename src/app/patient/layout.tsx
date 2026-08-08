'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Hospital,
  LayoutDashboard,
  UserRound,
  CalendarCheck,
  FileText,
  Pill,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Bed,
  Utensils,
  FlaskConical
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './layout.module.css';

const navItems = [
  { name: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/patient/profile', icon: UserRound },
  { name: 'Appointments', href: '/patient/appointments', icon: CalendarCheck },
  { name: 'Admissions', href: '/patient/admission', icon: Bed },
  { name: 'Medical Records', href: '/patient/records', icon: FileText },
  { name: 'Laboratory', href: '/patient/laboratory', icon: FlaskConical },
  { name: 'Prescription', href: '/patient/pharmacy', icon: Pill },
  { name: 'Billing', href: '/patient/billing', icon: CreditCard },
  { name: 'Canteen', href: '/patient/canteen', icon: Utensils },
  { name: 'Notifications', href: '/patient/notifications', icon: Bell },
  { name: 'Settings', href: '/patient/settings', icon: Settings },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    if (pathname.endsWith('/login')) {
      setIsAuthChecking(false);
      return;
    }
    const cookieMatch = document.cookie.match(/(?:^|; )demo_auth=([^;]*)/);
    if (!cookieMatch || cookieMatch[1] !== 'patient') {
      window.location.href = '/patient/login';
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

  

  const handleLogout = async () => {
    setLoading(true);
    // Clear demo auth cookie
    document.cookie = 'demo_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Call Supabase signout (will safely fail or do nothing if unconfigured)
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    router.push('/');
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Hospital size={28} color="var(--color-primary)" />
          <span>Patient Portal</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className={styles.logoutBtn}
          disabled={loading}
        >
          <LogOut size={20} />
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
