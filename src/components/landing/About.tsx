'use client';

import React from 'react';
import { Target, Eye, HeartHandshake, Hospital } from 'lucide-react';
import styles from './About.module.css';
import landingStyles from '@/app/landing.module.css';

export default function About() {
  return (
    <section id="about" className={landingStyles.section}>
      <h2 className={landingStyles.sectionTitle}>About Our Hospital</h2>
      <p className={landingStyles.sectionSubtitle}>
        Leading the way in medical excellence and digital healthcare transformation.
      </p>

      <div className={styles.aboutContent}>
        {/* Left Side: Image Placeholder */}
        <div className={styles.imagePlaceholder}>
          <Hospital size={80} strokeWidth={1} />
        </div>

        {/* Right Side: Text Content */}
        <div className={styles.textContent}>
          <div className={styles.textBlock}>
            <h3><Target size={24} color="var(--color-primary)" /> Our Mission</h3>
            <p>
              To provide compassionate, accessible, high-quality, and cost-effective healthcare to the community. We strive to improve health outcomes through innovative technology, patient-centered care, and continuous medical education.
            </p>
          </div>

          <div className={styles.textBlock}>
            <h3><Eye size={24} color="var(--color-primary)" /> Our Vision</h3>
            <p>
              To be the premier healthcare destination globally, recognized for unparalleled patient experiences, exceptional clinical outcomes, and the seamless integration of advanced digital health systems.
            </p>
          </div>

          <div className={styles.textBlock}>
            <h3><HeartHandshake size={24} color="var(--color-primary)" /> Core Values</h3>
            <p>
              Compassion, Excellence, Integrity, Innovation, and Teamwork. We believe in treating every patient like family, utilizing modern technology to ensure the highest level of safety and precision.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
