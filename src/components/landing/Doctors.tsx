'use client';

import React from 'react';
import { User2, Star, Award, Clock } from 'lucide-react';
import styles from './Doctors.module.css';
import landingStyles from '@/app/landing.module.css';

const doctors = [
  { name: 'Dr. Sarah Jenkins', dept: 'Cardiology', exp: '15+ Years', rating: '4.9/5', spec: 'Interventional Cardiology' },
  { name: 'Dr. Michael Chen', dept: 'Neurology', exp: '12+ Years', rating: '4.8/5', spec: 'Clinical Neurology' },
  { name: 'Dr. Emily Rodriguez', dept: 'Pediatrics', exp: '10+ Years', rating: '5.0/5', spec: 'Neonatal Care' },
  { name: 'Dr. James Wilson', dept: 'Orthopedics', exp: '18+ Years', rating: '4.9/5', spec: 'Joint Replacement' }
];

export default function Doctors() {
  return (
    <section id="doctors" className={landingStyles.section} style={{ backgroundColor: 'white' }}>
      <h2 className={landingStyles.sectionTitle}>Our Expert Doctors</h2>
      <p className={landingStyles.sectionSubtitle}>
        Meet our team of highly qualified and experienced medical professionals dedicated to your well-being.
      </p>

      <div className={styles.doctorsGrid}>
        {doctors.map((doc, index) => (
          <div key={index} className={styles.doctorCard}>
            <div className={styles.imagePlaceholder}>
              <User2 size={80} strokeWidth={1} />
            </div>
            <div className={styles.cardBody}>
              <h3 className={styles.doctorName}>{doc.name}</h3>
              <div className={styles.doctorDept}>{doc.dept}</div>
              
              <div className={styles.doctorDetails}>
                <div className={styles.detailRow}>
                  <Award size={16} /> {doc.spec}
                </div>
                <div className={styles.detailRow}>
                  <Clock size={16} /> {doc.exp} Experience
                </div>
                <div className={styles.detailRow}>
                  <Star size={16} className={styles.rating} fill="currentColor" /> {doc.rating} Rating
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
