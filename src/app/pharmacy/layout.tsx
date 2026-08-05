'use client';

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

  // Don't show sidebar on login page
  if (pathname === '/pharmacy/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/pharmacy/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/pharmacy/dashboard', icon: LayoutDashboard },
    { name: 'Prescriptions', path: '/pharmacy/prescriptions', icon: ClipboardList },
  ];

  const inventoryItems = [
    { name: 'Inventory', path: '/pharmacy/inventory', icon: Package },
    { name: 'Stock Alerts', path: '/pharmacy/alerts', icon: AlertTriangle },
    { name: 'Suppliers', path: '/pharmacy/suppliers', icon: Truck },
    { name: 'Purchase Orders', path: '/pharmacy/orders', icon: ShoppingCart },
  ];

  const billingItems = [
    { name: 'Billing', path: '/pharmacy/billing', icon: Receipt },
    { name: 'Reports', path: '/pharmacy/reports', icon: FileText },
  ];

  const systemItems = [
    { name: 'Notifications', path: '/pharmacy/notifications', icon: Bell },
    { name: 'Settings', path: '/pharmacy/settings', icon: Settings },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <Pill size={32} />
          <span>HMS Pharmacy</span>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navGroup}>Core Module</div>
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

          <div className={styles.navGroup}>Inventory</div>
          {inventoryItems.map((item) => {
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

          <div className={styles.navGroup}>Finance</div>
          {billingItems.map((item) => {
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

          <div className={styles.navGroup}>System</div>
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
