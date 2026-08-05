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
  LogOut
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './layout.module.css';

const navItems = [
  { name: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/patient/profile', icon: UserRound },
  { name: 'Appointments', href: '/patient/appointments', icon: CalendarCheck },
  { name: 'Medical Records', href: '/patient/records', icon: FileText },
  { name: 'Pharmacy', href: '/patient/pharmacy', icon: Pill },
  { name: 'Billing', href: '/patient/billing', icon: CreditCard },
  { name: 'Notifications', href: '/patient/notifications', icon: Bell },
  { name: 'Settings', href: '/patient/settings', icon: Settings },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

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
    router.push('/patient/login');
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
