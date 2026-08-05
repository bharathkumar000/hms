'use client';

import React from 'react';
import { UserRound, Stethoscope, ClipboardList, FlaskConical, Pill, ShieldCheck } from 'lucide-react';
import styles from './SystemFeatures.module.css';
import landingStyles from '@/app/landing.module.css';

const portals = [
  {
    title: 'Patient Portal',
    description: 'Empowers patients to securely access their medical records, view test results, and schedule upcoming appointments from anywhere.',
    icon: UserRound
  },
  {
    title: 'Doctor Portal',
    description: 'Provides physicians with instant access to patient histories, appointment schedules, and the ability to update clinical notes seamlessly.',
    icon: Stethoscope
  },
  {
    title: 'Reception Portal',
    description: 'Streamlines front-desk operations including rapid patient registration, appointment management, and handling daily inquiries.',
    icon: ClipboardList
  },
  {
    title: 'Laboratory Portal',
    description: 'Enables lab technicians to manage sample requests, process diagnostics, and upload test results directly to patient records.',
    icon: FlaskConical
  },
  {
    title: 'Pharmacy Portal',
    description: 'Facilitates efficient processing of digital prescriptions, robust drug inventory management, and accurate medication dispensing.',
    icon: Pill
  },
  {
    title: 'Admin Portal',
    description: 'Offers comprehensive oversight of hospital operations, role-based access control, billing metrics, and overall system configuration.',
    icon: ShieldCheck
  }
];

export default function SystemFeatures() {
  return (
    <section className={landingStyles.section} style={{ backgroundColor: 'white' }}>
      <h2 className={landingStyles.sectionTitle}>Integrated Hospital Management</h2>
      <p className={landingStyles.sectionSubtitle}>
        Our interconnected digital portals ensure smooth communication and data flow across all departments.
      </p>

      <div className={styles.systemGrid}>
        {portals.map((portal, index) => {
          const Icon = portal.icon;
          return (
            <div key={index} className={styles.systemCard}>
              <div className={styles.iconWrapper}>
                <Icon size={32} />
              </div>
              <h3 className={styles.cardTitle}>{portal.title}</h3>
              <p className={styles.cardDesc}>{portal.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
