'use client';

import React from 'react';
import { Database, ShieldCheck, Cloud, FileCode, CheckCircle, SearchCode, Cpu, Code2, Network } from 'lucide-react';
import styles from './Technology.module.css';
import landingStyles from '@/app/landing.module.css';

const techList = [
  { icon: FileCode, title: 'Electronic Medical Records' },
  { icon: CheckCircle, title: 'Digital Prescriptions' },
  { icon: ShieldCheck, title: 'Secure Authentication' },
  { icon: Cloud, title: 'Cloud Database (Supabase)' },
  { icon: SearchCode, title: 'Appointment Automation' },
  { icon: Cpu, title: 'Laboratory Automation' },
  { icon: Network, title: 'Inventory Management' },
  { icon: Code2, title: 'Role-Based Access Control' },
  { icon: Database, title: 'Data Security & Encryption' }
];

export default function Technology() {
  return (
    <section className={landingStyles.section} style={{ backgroundColor: 'white' }}>
      <h2 className={landingStyles.sectionTitle}>Digital Infrastructure</h2>
      <p className={landingStyles.sectionSubtitle}>
        Our hospital is powered by an enterprise-grade digital core to ensure efficiency, accuracy, and security.
      </p>

      <div className={styles.techGrid}>
        {techList.map((tech, index) => {
          const Icon = tech.icon;
          return (
            <div key={index} className={styles.techCard}>
              <div className={styles.iconWrapper}>
                <Icon size={24} />
              </div>
              <span className={styles.techTitle}>{tech.title}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
