'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Coffee,
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  ChefHat,
  Truck,
  CreditCard,
  BarChart3,
  UserRound,
  Settings,
  LogOut
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './layout.module.css';

const navItems = [
  { name: 'Dashboard', href: '/canteen/dashboard', icon: LayoutDashboard },
  { name: 'Menu', href: '/canteen/menu', icon: UtensilsCrossed },
  { name: 'Orders', href: '/canteen/orders', icon: ClipboardList },
  { name: 'Kitchen', href: '/canteen/kitchen', icon: ChefHat },
  { name: 'Delivery', href: '/canteen/delivery', icon: Truck },
  { name: 'Payments', href: '/canteen/payments', icon: CreditCard },
  { name: 'Reports', href: '/canteen/reports', icon: BarChart3 },
  { name: 'Profile', href: '/canteen/profile', icon: UserRound },
  { name: 'Settings', href: '/canteen/settings', icon: Settings },
];

export default function CanteenLayout({ children }: { children: React.ReactNode }) {
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
    if (!cookieMatch || cookieMatch[1] !== 'canteen') {
      window.location.href = '/canteen/login';
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
    document.cookie = 'demo_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

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
          <Coffee size={28} color="var(--color-primary)" />
          <span>Canteen Portal</span>
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
