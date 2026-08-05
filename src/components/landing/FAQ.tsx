'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FAQ.module.css';
import landingStyles from '@/app/landing.module.css';

const faqs = [
  {
    q: 'How can I book an appointment?',
    a: 'You can book an appointment by logging into the Patient Portal, selecting your preferred department and doctor, and choosing an available time slot.'
  },
  {
    q: 'How do I access my medical records?',
    a: 'All your medical records, including consultation notes, prescriptions, and lab reports, are securely stored in your Patient Portal dashboard.'
  },
  {
    q: 'How do doctors update prescriptions?',
    a: 'Doctors use their dedicated portal to digitally prescribe medications. This prescription is instantly visible to the patient and directly accessible by the hospital pharmacy.'
  },
  {
    q: 'How are laboratory reports delivered?',
    a: 'Once your test is processed, the laboratory staff uploads the result via the Lab Portal. The result immediately syncs to your patient profile and is available for your doctor to review.'
  },
  {
    q: 'Is my medical data secure?',
    a: 'Absolutely. We use enterprise-grade cloud databases with strict Role-Based Access Control. Your data is encrypted and only accessible by authorized medical personnel.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={landingStyles.section}>
      <h2 className={landingStyles.sectionTitle}>Frequently Asked Questions</h2>
      <p className={landingStyles.sectionSubtitle}>
        Everything you need to know about our hospital and the digital management system.
      </p>

      <div className={styles.faqContainer}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className={styles.faqItem}>
              <button className={styles.question} onClick={() => toggleFaq(index)}>
                {faq.q}
                <ChevronDown className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`} size={20} />
              </button>
              {isOpen && <div className={styles.answer}>{faq.a}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
