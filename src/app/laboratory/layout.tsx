'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FlaskConical, 
  LayoutDashboard, 
  ClipboardList,
  TestTube,
  Activity,
  FileText,
  AlertTriangle,
  Archive,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './layout.module.css';

const navItems = [
  { name: 'Dashboard', href: '/laboratory/dashboard', icon: LayoutDashboard },
  { name: 'Test Orders', href: '/laboratory/orders', icon: ClipboardList },
  { name: 'Sample Tracking', href: '/laboratory/samples', icon: TestTube },
  { name: 'Processing', href: '/laboratory/processing', icon: Activity },
  { name: 'Report Management', href: '/laboratory/reports', icon: FileText },
  { name: 'Urgent Cases', href: '/laboratory/urgent', icon: AlertTriangle },
  { name: 'Archive', href: '/laboratory/archive', icon: Archive },
  { name: 'Notifications', href: '/laboratory/notifications', icon: Bell },
  { name: 'Settings', href: '/laboratory/settings', icon: Settings },
];

export default function LaboratoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

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
          <FlaskConical size={28} color="var(--color-primary)" />
          <span>Laboratory Portal</span>
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
