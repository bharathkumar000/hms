'use client';

import React from 'react';
import Link from 'next/link';
import { Hospital, MapPin, Phone, Mail, Clock, Globe } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        
        {/* Brand */}
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <Hospital size={28} color="var(--color-primary)" />
            <span>HMS Medical Center</span>
          </Link>
          <p>
            Providing world-class healthcare with advanced digital infrastructure and compassionate medical professionals.
          </p>
          <div className={styles.social}>
            <a href="#" aria-label="Facebook"><Globe size={20} /></a>
            <a href="#" aria-label="Twitter"><Globe size={20} /></a>
            <a href="#" aria-label="Instagram"><Globe size={20} /></a>
            <a href="#" aria-label="LinkedIn"><Globe size={20} /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className={styles.column}>
          <h4>Quick Links</h4>
          <div className={styles.links}>
            <Link href="#about">About Us</Link>
            <Link href="#services">Our Services</Link>
            <Link href="#departments">Departments</Link>
            <Link href="#doctors">Find a Doctor</Link>
            <Link href="/portals">Portal Login</Link>
          </div>
        </div>

        {/* Departments */}
        <div className={styles.column}>
          <h4>Departments</h4>
          <div className={styles.links}>
            <Link href="#departments">Cardiology</Link>
            <Link href="#departments">Neurology</Link>
            <Link href="#departments">Orthopedics</Link>
            <Link href="#departments">Pediatrics</Link>
            <Link href="#departments">Emergency</Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className={styles.column}>
          <h4>Contact Us</h4>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <MapPin className={styles.contactIcon} size={20} />
              <span>123 Health Avenue, Medical District, NY 10001</span>
            </div>
            <div className={styles.contactItem}>
              <Phone className={styles.contactIcon} size={20} />
              <span>+1 (800) 123-4567<br/>+1 (800) 765-4321</span>
            </div>
            <div className={styles.contactItem}>
              <Mail className={styles.contactIcon} size={20} />
              <span>contact@hmsmedical.com</span>
            </div>
            <div className={styles.contactItem}>
              <Clock className={styles.contactIcon} size={20} />
              <span>24/7 Emergency Services<br/>OPD: 8 AM - 8 PM</span>
            </div>
          </div>
        </div>

      </div>

      <div className={styles.bottomBar}>
        <div>&copy; {new Date().getFullYear()} HMS Medical Center. All rights reserved.</div>
        <div className={styles.bottomLinks}>
          <Link href="#">Privacy Policy</Link>
          <Link href="#">Terms & Conditions</Link>
          <Link href="#">Sitemap</Link>
        </div>
      </div>
    </footer>
  );
}
