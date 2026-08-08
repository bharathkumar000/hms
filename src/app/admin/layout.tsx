'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  Building2, 
  Calendar, 
  BarChart3, 
  Package, 
  Receipt, 
  Settings, 
  FileText,
  LogOut
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './layout.module.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (pathname === '/admin/login') {
        setIsAuthChecking(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/admin/login';
      } else {
        setIsAuthChecking(false);
      }
    };
    
    checkAuth();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

  // Don't show sidebar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isAuthChecking) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading Admin Portal...</div>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navGroups = [
    {
      title: 'DASHBOARD',
      items: [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'HOSPITAL MANAGEMENT',
      items: [
        { name: 'Departments', path: '/admin/departments', icon: Building2 },
        { name: 'Wards & Rooms', path: '/admin/wards-rooms', icon: Building2 },
        { name: 'Beds', path: '/admin/beds', icon: Building2 },
        { name: 'Staff & Users', path: '/admin/users', icon: Users },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Appointments', path: '/admin/operations/appointments', icon: Calendar },
        { name: 'Admissions', path: '/admin/operations/admissions', icon: Calendar },
        { name: 'Queue Monitoring', path: '/admin/operations/queue', icon: Calendar },
      ]
    },
    {
      title: 'MONITORING',
      items: [
        { name: 'Hospital Analytics', path: '/admin/analytics', icon: BarChart3 },
        { name: 'Inventory', path: '/admin/inventory', icon: Package },
        { name: 'Billing Overview', path: '/admin/billing', icon: Receipt },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Notifications', path: '/admin/system/notifications', icon: ShieldCheck },
        { name: 'Audit Logs', path: '/admin/system/audit', icon: FileText },
        { name: 'System Settings', path: '/admin/system/settings', icon: Settings },
        { name: 'Profile', path: '/admin/system/profile', icon: Users },
      ]
    }
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <ShieldCheck size={32} />
          <span>HMS Admin</span>
        </div>

        <nav className={styles.nav}>
          {navGroups.map((group) => (
            <div key={group.title} style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', paddingLeft: '1rem', letterSpacing: '0.05em' }}>
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
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
