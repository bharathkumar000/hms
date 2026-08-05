'use client';

import React from 'react';
import { 
  Award, 
  ShieldCheck, 
  Bot, 
  CalendarCheck, 
  FileText, 
  FileBarChart, 
  Zap, 
  Pill, 
  Ambulance, 
  Activity 
} from 'lucide-react';
import styles from './Features.module.css';
import landingStyles from '@/app/landing.module.css';

const features = [
  { icon: Award, title: 'Highly Qualified Doctors', desc: 'Our medical team consists of internationally trained experts.' },
  { icon: ShieldCheck, title: 'Secure Medical Records', desc: '100% digital and encrypted records ensuring your data is safe.' },
  { icon: Bot, title: 'AI Assisted Healthcare', desc: 'Utilizing AI for faster diagnostics and personalized care.' },
  { icon: CalendarCheck, title: 'Smart Appointment System', desc: 'Book and manage your appointments seamlessly online.' },
  { icon: FileText, title: 'Digital Prescriptions', desc: 'Paperless prescriptions sent directly to your pharmacy app.' },
  { icon: FileBarChart, title: 'Online Reports', desc: 'Access your laboratory and radiology reports instantly.' },
  { icon: Zap, title: 'Fast Laboratory Processing', desc: 'State-of-the-art labs ensuring rapid and accurate test results.' },
  { icon: Pill, title: 'Modern Pharmacy', desc: 'Fully integrated pharmacy system for immediate medicine dispensing.' },
  { icon: Ambulance, title: '24x7 Emergency Services', desc: 'Round-the-clock critical care and ambulance support.' },
  { icon: Activity, title: 'Advanced Medical Equipment', desc: 'Equipped with the latest medical technology for optimal treatment.' }
];

export default function Features() {
  return (
    <section id="features" className={landingStyles.section}>
      <h2 className={landingStyles.sectionTitle}>Why Choose Us</h2>
      <p className={landingStyles.sectionSubtitle}>
        We combine world-class medical expertise with cutting-edge digital infrastructure.
      </p>

      <div className={styles.featuresGrid}>
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className={styles.featureCard}>
              <div className={styles.iconContainer}>
                <Icon size={24} />
              </div>
              <div className={styles.featureContent}>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
