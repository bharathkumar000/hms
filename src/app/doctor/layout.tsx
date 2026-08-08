'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Stethoscope, 
  LayoutDashboard, 
  Calendar,
  MessageSquare,
  AlertCircle,
  Users,
  FileSignature,
  Microscope,
  BarChart,
  Settings,
  LogOut,
  Bed,
  Coffee
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './layout.module.css';

const navItems = [
  { name: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
  { name: 'Schedule', href: '/doctor/schedule', icon: Calendar },
  { name: 'Consultations', href: '/doctor/consultations', icon: MessageSquare },
  { name: 'Emergencies', href: '/doctor/emergencies', icon: AlertCircle },
  { name: 'Admissions', href: '/doctor/admissions', icon: Bed },
  { name: 'Patients', href: '/doctor/patients', icon: Users },
  { name: 'Prescriptions', href: '/doctor/prescriptions', icon: FileSignature },
  { name: 'Lab Reports', href: '/doctor/lab', icon: Microscope },
  { name: 'Reports', href: '/doctor/reports', icon: BarChart },
  { name: 'Canteen', href: '/doctor/canteen', icon: Coffee },
  { name: 'Settings', href: '/doctor/settings', icon: Settings },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
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
    if (!cookieMatch || cookieMatch[1] !== 'doctor') {
      window.location.href = '/doctor/login';
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
          <Stethoscope size={28} color="var(--color-primary)" />
          <span>Doctor Portal</span>
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
