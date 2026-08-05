'use client';

import React from 'react';
import { 
  UserPlus, 
  CalendarPlus, 
  Stethoscope, 
  TestTube, 
  FileText, 
  Pill, 
  CreditCard, 
  FolderLock 
} from 'lucide-react';
import styles from './HowItWorks.module.css';
import landingStyles from '@/app/landing.module.css';

const steps = [
  { icon: UserPlus, title: 'Patient Registration', desc: 'Register online or at the reception desk in under 2 minutes.' },
  { icon: CalendarPlus, title: 'Appointment Booking', desc: 'Select your preferred doctor and book an available time slot.' },
  { icon: Stethoscope, title: 'Doctor Consultation', desc: 'Consult with the doctor who updates your clinical notes digitally.' },
  { icon: TestTube, title: 'Laboratory Tests', desc: 'If required, get your tests done. Results are automatically uploaded.' },
  { icon: FileText, title: 'Digital Prescription', desc: 'Receive your e-prescription instantly on your patient portal.' },
  { icon: Pill, title: 'Pharmacy', desc: 'Collect medicines directly from the pharmacy using your e-prescription.' },
  { icon: CreditCard, title: 'Billing', desc: 'Clear any dues transparently at the billing counter or online.' },
  { icon: FolderLock, title: 'Medical Records', desc: 'All your medical history is securely stored for future reference.' }
];

export default function HowItWorks() {
  return (
    <section className={landingStyles.section}>
      <h2 className={landingStyles.sectionTitle}>The Patient Journey</h2>
      <p className={landingStyles.sectionSubtitle}>
        Experience a seamless, paperless, and highly organized healthcare journey.
      </p>

      <div className={styles.timeline}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className={styles.timelineItem}>
              <div className={styles.iconWrapper}>
                <Icon size={28} />
              </div>
              <div className={styles.content}>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
