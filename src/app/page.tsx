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
import SystemFeatures from '@/components/landing/SystemFeatures';
import HowItWorks from '@/components/landing/HowItWorks';
import Doctors from '@/components/landing/Doctors';
import Testimonials from '@/components/landing/Testimonials';
import Gallery from '@/components/landing/Gallery';
import Technology from '@/components/landing/Technology';
import Emergency from '@/components/landing/Emergency';
import FAQ from '@/components/landing/FAQ';
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
        <SystemFeatures />
        <HowItWorks />
        <Doctors />
        <Testimonials />
        <Gallery />
        <Technology />
        <Emergency />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
