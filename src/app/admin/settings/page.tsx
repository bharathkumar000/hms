'use client';

import { useState } from 'react';
import { Save, Shield, Building, User } from 'lucide-react';
import styles from '../users/users.module.css';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'hospital' | 'rbac' | 'profile'>('hospital');

  const [hospitalInfo, setHospitalInfo] = useState({
    name: 'Apollo Spectra Hospital',
    address: '123 Health Avenue, Medical District',
    phone: '+91 9876543210',
    email: 'contact@apollospectra.com',
    website: 'www.apollospectra.com'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings saved successfully! (Demo only)');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>System Settings</h1>
          <p className={styles.details}>Configure hospital information, roles, and admin profile.</p>
        </div>
      </header>

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'hospital' ? styles.activeTab : ''}`} onClick={() => setActiveTab('hospital')}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building size={18} /> Hospital Info</span>
          </button>
          <button className={`${styles.tab} ${activeTab === 'rbac' ? styles.activeTab : ''}`} onClick={() => setActiveTab('rbac')}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={18} /> Roles & Permissions</span>
          </button>
          <button className={`${styles.tab} ${activeTab === 'profile' ? styles.activeTab : ''}`} onClick={() => setActiveTab('profile')}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={18} /> Admin Profile</span>
          </button>
        </div>

        {activeTab === 'hospital' && (
          <form onSubmit={handleSave} style={{ maxWidth: '600px' }}>
            <div className={styles.formGroup}>
              <label>Hospital Name</label>
              <input type="text" value={hospitalInfo.name} onChange={e => setHospitalInfo({...hospitalInfo, name: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Address</label>
              <input type="text" value={hospitalInfo.address} onChange={e => setHospitalInfo({...hospitalInfo, address: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Contact Phone</label>
              <input type="text" value={hospitalInfo.phone} onChange={e => setHospitalInfo({...hospitalInfo, phone: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input type="email" value={hospitalInfo.email} onChange={e => setHospitalInfo({...hospitalInfo, email: e.target.value})} />
            </div>
            <div className={styles.formGroup}>
              <label>Website</label>
              <input type="text" value={hospitalInfo.website} onChange={e => setHospitalInfo({...hospitalInfo, website: e.target.value})} />
            </div>
            <button type="submit" className={styles.btnPrimary} style={{ marginTop: '1.5rem' }}>
              <Save size={18} /> Save Settings
            </button>
          </form>
        )}

        {activeTab === 'rbac' && (
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Role-Based Access Control (RBAC)</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Manage permissions for different user roles in the system.
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Access Level</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Administrator</td>
                  <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Full Access</span></td>
                  <td>Can manage users, settings, and view all hospital analytics.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Doctor</td>
                  <td><span className={styles.badge} style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>Clinical</span></td>
                  <td>Can manage own appointments, patients, and prescribe medicine.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Receptionist</td>
                  <td><span className={styles.badge} style={{ backgroundColor: '#ffedd5', color: '#c2410c' }}>Front Desk</span></td>
                  <td>Can manage patient registrations, queue, and general billing.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Pharmacist</td>
                  <td><span className={styles.badge} style={{ backgroundColor: '#d1fae5', color: '#047857' }}>Pharmacy</span></td>
                  <td>Can manage inventory, dispense prescriptions, and pharmacy billing.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Laboratory Staff</td>
                  <td><span className={styles.badge} style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>Laboratory</span></td>
                  <td>Can process lab requests and upload reports.</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'profile' && (
          <form onSubmit={handleSave} style={{ maxWidth: '600px' }}>
            <div className={styles.formGroup}>
              <label>Current Password</label>
              <input type="password" placeholder="••••••••" />
            </div>
            <div className={styles.formGroup}>
              <label>New Password</label>
              <input type="password" placeholder="Leave blank to keep current" />
            </div>
            <div className={styles.formGroup}>
              <label>Confirm New Password</label>
              <input type="password" placeholder="Leave blank to keep current" />
            </div>
            <button type="submit" className={styles.btnPrimary} style={{ marginTop: '1.5rem' }}>
              <Save size={18} /> Update Profile
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
