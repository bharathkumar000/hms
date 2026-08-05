'use client';

import React from 'react';
import { 
  Stethoscope, 
  Ambulance, 
  FlaskConical, 
  Pill, 
  BedDouble, 
  Activity, 
  Syringe, 
  Scan,
  Baby,
  HeartPulse,
  Bone,
  UserRound
} from 'lucide-react';
import styles from './Services.module.css';
import landingStyles from '@/app/landing.module.css';

const services = [
  { icon: Stethoscope, title: 'General Consultation', desc: 'Expert medical advice for your day-to-day health concerns.' },
  { icon: Ambulance, title: 'Emergency Care', desc: '24/7 emergency response and critical care services.' },
  { icon: FlaskConical, title: 'Laboratory Services', desc: 'Advanced diagnostics and fast, accurate lab results.' },
  { icon: Pill, title: 'Pharmacy', desc: 'Fully stocked pharmacy for all your prescription needs.' },
  { icon: BedDouble, title: 'Inpatient Care', desc: 'Comfortable, monitored recovery rooms and wards.' },
  { icon: Activity, title: 'Outpatient Care', desc: 'Comprehensive care without overnight hospital stays.' },
  { icon: Syringe, title: 'Surgery', desc: 'State-of-the-art operation theatres for various procedures.' },
  { icon: Scan, title: 'Radiology', desc: 'X-Rays, MRI, CT Scans, and Ultrasound diagnostics.' },
  { icon: Baby, title: 'Pediatrics', desc: 'Specialized healthcare for infants, children, and adolescents.' },
  { icon: HeartPulse, title: 'Cardiology', desc: 'Expert heart care, ECG, and cardiovascular treatments.' },
  { icon: Bone, title: 'Orthopedics', desc: 'Treatment for bone, joint, and muscle conditions.' },
  { icon: UserRound, title: 'Women\'s Health', desc: 'Comprehensive gynecological and obstetric care.' }
];

export default function Services() {
  return (
    <section id="services" className={landingStyles.section} style={{ backgroundColor: 'white' }}>
      <h2 className={landingStyles.sectionTitle}>Our Services</h2>
      <p className={landingStyles.sectionSubtitle}>
        Comprehensive healthcare services tailored to meet all your medical needs under one roof.
      </p>

      <div className={styles.servicesGrid}>
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <div key={index} className={styles.serviceCard}>
              <div className={styles.iconWrapper}>
                <Icon size={28} />
              </div>
              <h3 className={styles.serviceTitle}>{service.title}</h3>
              <p className={styles.serviceDesc}>{service.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
