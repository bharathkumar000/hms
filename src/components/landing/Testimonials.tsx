'use client';

import React from 'react';
import { Star } from 'lucide-react';
import styles from './Testimonials.module.css';
import landingStyles from '@/app/landing.module.css';

const testimonials = [
  {
    name: 'Rajesh Kumar',
    feedback: '"The digital appointment system saved me so much time. I didn\'t have to wait in long queues, and my doctor had all my past records ready on his screen."',
    initial: 'R'
  },
  {
    name: 'Priya Sharma',
    feedback: '"I was amazed by the seamless process from consultation to pharmacy. My prescription was sent digitally to the counter before I even reached there!"',
    initial: 'P'
  },
  {
    name: 'Amit Patel',
    feedback: '"The patient portal is incredible. I can view my lab reports online the moment they are ready. Highly recommend this hospital for their technology and care."',
    initial: 'A'
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className={landingStyles.section} style={{ backgroundColor: 'white' }}>
      <h2 className={landingStyles.sectionTitle}>Patient Stories</h2>
      <p className={landingStyles.sectionSubtitle}>
        Don't just take our word for it. Hear what our patients have to say about their digital healthcare experience.
      </p>

      <div className={styles.testimonialsGrid}>
        {testimonials.map((test, index) => (
          <div key={index} className={styles.testimonialCard}>
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>{test.initial}</div>
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>{test.name}</span>
                <div className={styles.rating}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>
            </div>
            <p className={styles.feedback}>{test.feedback}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
