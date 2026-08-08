'use client';
import { useEffect } from 'react';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Pill, 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  AlertTriangle, 
  Truck, 
  ShoppingCart,
  Receipt,
  FileText,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './layout.module.css';

export default function PharmacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    if (pathname.endsWith('/login')) {
      setIsAuthChecking(false);
      return;
    }
    const cookieMatch = document.cookie.match(/(?:^|; )demo_auth=([^;]*)/);
    if (!cookieMatch || cookieMatch[1] !== 'pharmacy') {
      window.location.href = '/pharmacy/login';
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


  // Don't show sidebar on login page
  if (pathname === '/pharmacy/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/pharmacy/dashboard', icon: LayoutDashboard },
    { name: 'Prescription Management', path: '/pharmacy/prescriptions', icon: ClipboardList },
    { name: 'Inventory', path: '/pharmacy/inventory', icon: Package },
    { name: 'Dispensing', path: '/pharmacy/dispensing', icon: Pill },
    { name: 'Billing', path: '/pharmacy/billing', icon: Receipt },
    { name: 'Purchase & Suppliers', path: '/pharmacy/purchases', icon: Truck },
    { name: 'Reports', path: '/pharmacy/reports', icon: FileText },
  ];

  const systemItems = [
    { name: 'Notifications', path: '/pharmacy/notifications', icon: Bell },
    { name: 'Profile', path: '/pharmacy/profile', icon: Settings },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Pill size={32} />
          <span>HMS Pharmacy</span>
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

          {systemItems.map((item) => {
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
