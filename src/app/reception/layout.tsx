'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ClipboardList, 
  LayoutDashboard, 
  Users,
  Calendar,
  ListOrdered,
  CreditCard,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './layout.module.css';

const navItems = [
  { name: 'Dashboard', href: '/reception/dashboard', icon: LayoutDashboard },
  { name: 'Patient Registration', href: '/reception/registration', icon: Users },
  { name: 'Appointments', href: '/reception/appointments', icon: Calendar },
  { name: 'Admission Management', href: '/reception/admissions', icon: ClipboardList },
  { name: 'Patient Directory', href: '/reception/patients', icon: Users },
  { name: 'Billing Coordination', href: '/reception/billing', icon: CreditCard },
  { name: 'Doctor & Departments', href: '/reception/doctors', icon: ListOrdered },
  { name: 'Notifications', href: '/reception/notifications', icon: Bell },
  { name: 'Reports', href: '/reception/reports', icon: ClipboardList },
  { name: 'Profile', href: '/reception/settings', icon: Settings },
];

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    if (pathname.endsWith('/login')) {
      return;
    }
    const cookieMatch = document.cookie.match(/(?:^|; )demo_auth=([^;]*)/);
    if (!cookieMatch || cookieMatch[1] !== 'reception') {
      window.location.href = '/reception/login';
    } else {
      }
  }, [pathname, router]);

  if (pathname.endsWith('/login')) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setLoading(true);
    // Clear demo auth cookie
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
          <ClipboardList size={28} color="var(--color-primary)" />
          <span>Reception Portal</span>
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
