'use client';

import React from 'react';
import { Building2, Monitor, Stethoscope, FlaskConical, Pill, Syringe, Ambulance, Activity } from 'lucide-react';
import styles from './Gallery.module.css';
import landingStyles from '@/app/landing.module.css';

const galleryItems = [
  { icon: Building2, label: 'Hospital Building', className: styles.large },
  { icon: Monitor, label: 'Modern Reception', className: '' },
  { icon: Stethoscope, label: 'Consultation Room', className: '' },
  { icon: FlaskConical, label: 'Advanced Laboratory', className: styles.wide },
  { icon: Syringe, label: 'Operation Theatre', className: styles.tall },
  { icon: Activity, label: 'ICU Ward', className: '' },
  { icon: Pill, label: '24x7 Pharmacy', className: '' },
  { icon: Ambulance, label: 'Emergency Ward', className: styles.wide }
];

export default function Gallery() {
  return (
    <section id="gallery" className={landingStyles.section}>
      <h2 className={landingStyles.sectionTitle}>Hospital Gallery</h2>
      <p className={landingStyles.sectionSubtitle}>
        Take a virtual tour of our state-of-the-art facilities and modern medical infrastructure.
      </p>

      <div className={styles.galleryGrid}>
        {galleryItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className={`${styles.galleryItem} ${item.className}`}>
              {/* This is a placeholder for actual background images */}
              <Icon size={48} strokeWidth={1} />
              
              <div className={styles.overlay}>
                <Icon size={32} />
                <span>{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
