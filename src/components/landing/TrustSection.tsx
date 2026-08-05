'use client';

import React, { useEffect, useState } from 'react';
import styles from './Trust.module.css';

export default function TrustSection() {
  const [counts, setCounts] = useState([0, 0, 0, 0, 0]);
  const targets = [25, 150, 50000, 24, 99];
  const suffixes = ['+', '+', '+', 'x7', '.9%'];
  const labels = [
    'Departments',
    'Doctors',
    'Patients Served',
    'Emergency Care',
    'Secure Digital Records'
  ];

  useEffect(() => {
    // Simple counter animation
    const duration = 2000; // 2 seconds
    const steps = 50;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setCounts(targets.map(target => Math.floor((target / steps) * currentStep)));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setCounts(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className={styles.trustSection}>
      <div className={styles.grid}>
        {labels.map((label, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statValue}>
              {counts[index] === targets[index] 
                ? (index === 2 ? '50,000' : targets[index]) 
                : (index === 2 ? counts[index] * 1000 : counts[index])}
              {suffixes[index]}
            </div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
