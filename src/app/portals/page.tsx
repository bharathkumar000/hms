'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import ModuleCard from '@/components/ModuleCard';
import styles from './page.module.css';
import { 
  ArrowLeft,
  UserRound, 
  Stethoscope, 
  ClipboardList, 
  FlaskConical, 
  Pill, 
  ShieldCheck,
  Receipt,
  Coffee
} from 'lucide-react';

const modules = [
  {
    title: 'Patient Portal',
    description: 'Access medical records, view test results, and schedule appointments with ease.',
    icon: UserRound,
    href: '/patient/login'
  },
  {
    title: 'Doctor Portal',
    description: 'Manage patient schedules, access clinical histories, and update medical notes.',
    icon: Stethoscope,
    href: '/doctor/login'
  },
  {
    title: 'Reception Portal',
    description: 'Handle patient registration, manage front-desk operations, and direct inquiries.',
    icon: ClipboardList,
    href: '/reception/login'
  },
  {
    title: 'Laboratory Portal',
    description: 'Update test results, manage lab requests, and track sample diagnostics.',
    icon: FlaskConical,
    href: '/laboratory/login'
  },
  {
    title: 'Pharmacy Portal',
    description: 'Process prescriptions, manage drug inventory, and update medication logs.',
    icon: Pill,
    href: '/pharmacy/login'
  },
  {
    title: 'Admin Portal',
    description: 'Monitor hospital operations, manage staff roles, and configure system settings.',
    icon: ShieldCheck,
    href: '/admin/login'
  },
  {
    title: 'Billing & Finance Portal',
    description: 'Manage Billing, Payments, Revenue & Financial Records',
    icon: Receipt,
    href: '/billing/login'
  },
  {
    title: 'Canteen Portal',
    description: 'Manage food orders, kitchen operations, and canteen deliveries.',
    icon: Coffee,
    href: '/canteen/login'
  }
];

export default function Home() {
  return (
    <main className={styles.main}>
      <Link href="/" style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s ease', zIndex: 10 }}>
        <ArrowLeft size={20} />
        Back to Home
      </Link>
      <div className={styles.background} />
      <div className={styles.container}>
        <Header />
        <div className={styles.grid}>
          {modules.map((module) => (
            <ModuleCard 
              key={module.title}
              title={module.title}
              description={module.description}
              icon={module.icon}
              href={module.href}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
