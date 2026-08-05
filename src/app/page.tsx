'use client';

import React from 'react';
import styles from './landing.module.css';

import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import TrustSection from '@/components/landing/TrustSection';
import About from '@/components/landing/About';
import Services from '@/components/landing/Services';
import Departments from '@/components/landing/Departments';
import Features from '@/components/landing/Features';
import Testimonials from '@/components/landing/Testimonials';
import Gallery from '@/components/landing/Gallery';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className={styles.landingContainer}>
      <Navbar />
      <main>
        <Hero />
        <TrustSection />
        <About />
        <Services />
        <Departments />
        <Features />
        <Testimonials />
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}
