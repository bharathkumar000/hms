'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, HeartPulse } from 'lucide-react';
import styles from './Hero.module.css';
import landingStyles from '@/app/landing.module.css';

export default function Hero() {
  return (
    <section id="home" className={`${landingStyles.section} ${styles.heroSection} ${landingStyles.animateFadeInUp}`}>
      <div className={styles.heroContent}>
        
        {/* Left Side: Content */}
        <div className={styles.leftSide}>
          <h1 className={styles.title}>
            Smart Healthcare for a <span className={styles.highlight}>Healthier Tomorrow</span>
          </h1>
          <p className={styles.description}>
            Experience the future of healthcare. Our Hospital Management System simplifies care for patients, doctors, laboratories, pharmacists, and administrators through one secure digital platform.
          </p>
          <div className={styles.actionGroup}>
            <Link href="/portals" className={styles.btnPrimary}>
              Get Started <ArrowRight size={20} />
            </Link>
            <a href="#about" className={styles.btnOutline}>
              Learn More
            </a>
          </div>
        </div>

        {/* Right Side: Illustration */}
        <div className={styles.rightSide}>
          <div className={styles.illustration}>
            <div className={styles.abstractShape1}></div>
            <div className={styles.abstractShape2}></div>
            <div className={styles.abstractShape3}></div>
            {/* Main Center Icon */}
            <HeartPulse size={160} color="var(--color-primary)" strokeWidth={1} style={{ zIndex: 10, background: 'white', borderRadius: '50%', padding: '2rem', boxShadow: 'var(--shadow-md)' }} />
          </div>
        </div>

      </div>
    </section>
  );
}
