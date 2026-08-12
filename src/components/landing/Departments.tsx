'use client';

import React from 'react';
import styles from './Departments.module.css';
import landingStyles from '@/app/landing.module.css';

const departments = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Dermatology',
  'Gynecology',
  'Oncology',
  'ENT',
  'Ophthalmology',
  'Radiology',
  'Emergency'
];

export default function Departments() {
  return (
    <section id="departments" className={landingStyles.section}>
      <h2 className={landingStyles.sectionTitle}>Specialized Departments</h2>
      <p className={landingStyles.sectionSubtitle}>
        Our hospital features dedicated departments led by industry experts to provide focused, specialized care.
      </p>

      <div className={styles.deptGrid}>
        {departments.map((dept, index) => (
          <div key={index} className={styles.deptCard}>
            <span className={styles.deptName}>{dept}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
