'use client';

import React from 'react';
import { AlertCircle, PhoneCall } from 'lucide-react';
import styles from './Emergency.module.css';

export default function Emergency() {
  return (
    <section className={styles.emergencySection}>
      <div className={styles.bgPattern}></div>
      <div className={styles.container}>
        <h2 className={styles.title}>
          <AlertCircle size={40} /> 24x7 Emergency Services
        </h2>
        <p className={styles.subtitle}>
          In case of a medical emergency, do not wait. Our rapid response team and fully equipped ICU ambulances are available round the clock.
        </p>
        
        <div className={styles.number}>1800-123-4567</div>
        
        <div className={styles.btnGroup}>
          <a href="tel:18001234567" className={styles.btnCall}>
            <PhoneCall size={20} /> Call Ambulance Now
          </a>
        </div>
      </div>
    </section>
  );
}
