'use client';

import Header from '@/components/Header';
import ModuleCard from '@/components/ModuleCard';
import styles from './page.module.css';
import { 
  UserRound, 
  Stethoscope, 
  ClipboardList, 
  FlaskConical, 
  Pill, 
  ShieldCheck 
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
  }
];

export default function Home() {
  return (
    <main className={styles.main}>
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
