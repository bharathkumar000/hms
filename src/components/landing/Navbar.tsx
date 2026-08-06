'use client';

import React from 'react';
import Link from 'next/link';
import { Hospital, Phone, Menu } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Hospital size={28} />
          <span>HMS</span>
        </Link>

        {/* Desktop Links */}
        <nav className={styles.navLinks}>
          <a href="#home" className={styles.navLink}>Home</a>
          <a href="#about" className={styles.navLink}>About</a>
          <a href="#services" className={styles.navLink}>Services</a>
          <a href="#departments" className={styles.navLink}>Departments</a>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#doctors" className={styles.navLink}>Doctors</a>
          <a href="#testimonials" className={styles.navLink}>Testimonials</a>
          <a href="#contact" className={styles.navLink}>Contact</a>
        </nav>

        {/* Desktop Actions */}
        <div className={styles.navActions}>
          <a href="#contact" className={styles.btnEmergency}>
            <Phone size={18} />
            Emergency
          </a>
          <Link href="/portals" className={styles.btnPrimary}>
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className={styles.mobileMenuBtn}>
          <Menu size={28} />
        </button>
      </div>
    </header>
  );
}
