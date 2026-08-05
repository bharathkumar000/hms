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
          <Link href="#home" className={styles.navLink}>Home</Link>
          <Link href="#about" className={styles.navLink}>About</Link>
          <Link href="#services" className={styles.navLink}>Services</Link>
          <Link href="#departments" className={styles.navLink}>Departments</Link>
          <Link href="#features" className={styles.navLink}>Features</Link>
          <Link href="#doctors" className={styles.navLink}>Doctors</Link>
          <Link href="#testimonials" className={styles.navLink}>Testimonials</Link>
          <Link href="#contact" className={styles.navLink}>Contact</Link>
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
