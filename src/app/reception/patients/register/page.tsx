'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import styles from '../patients.module.css';

export default function RegisterPatient() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uhid, setUhid] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '', // Needed to generate auth user
    date_of_birth: '',
    gender: 'Male',
    phone_number: '',
    address: '',
    blood_group: 'A+',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    insurance_provider: '',
    insurance_policy_number: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Auth User to get UUID (bypassing email verification for demo)
      const mockPassword = `Pass@${Math.random().toString(36).slice(-8)}`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email || `patient_${Date.now()}@hms-demo.com`,
        password: mockPassword
      });

      let patientId = authData?.user?.id;

      if (authError || !patientId) {
        // Fallback for demo environment if sign-up fails (e.g. rate limit): 
        // We will generate a UUID and try to insert it directly. If FK fails, we catch it.
        alert('Warning: Auth creation failed. This might be due to demo environment limits. Error: ' + authError?.message);
        setLoading(false);
        return;
      }

      // 2. Insert into profiles
      const { error: profileError } = await supabase.from('profiles').insert({
        id: patientId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        phone_number: formData.phone_number,
        address: formData.address,
        blood_group: formData.blood_group,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        insurance_provider: formData.insurance_provider,
        insurance_policy_number: formData.insurance_policy_number
      });

      if (profileError) {
        alert('Failed to save patient profile: ' + profileError.message);
        setLoading(false);
        return;
      }

      setUhid(patientId.substring(0, 8).toUpperCase());
      setSuccess(true);
    } catch (err: any) {
      alert('Registration error: ' + err.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckCircle size={64} color="#166534" style={{ margin: '0 auto 1rem' }} />
          <h1 className={styles.title} style={{ marginBottom: '1rem' }}>Patient Registered Successfully</h1>
          <p className={styles.details} style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
            Generated UHID: <strong>{uhid}</strong>
          </p>
          <button className={styles.btnPrimary} onClick={() => router.push('/reception/patients')}>
            Return to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <button 
            className={styles.btnOutline} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', border: 'none', padding: '0' }}
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className={styles.title}>Register New Patient</h1>
          <p className={styles.details}>Enter patient details to generate a unique UHID.</p>
        </div>
      </header>

      <div className={styles.card}>
        <form onSubmit={handleRegister}>
          <div className={styles.formGrid}>
            
            <div className={styles.formGroupFull}>
              <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Basic Information</h3>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>First Name *</label>
              <input type="text" name="first_name" required className={styles.input} value={formData.first_name} onChange={handleChange} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Last Name *</label>
              <input type="text" name="last_name" required className={styles.input} value={formData.last_name} onChange={handleChange} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Date of Birth *</label>
              <input type="date" name="date_of_birth" required className={styles.input} value={formData.date_of_birth} onChange={handleChange} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Gender *</label>
              <select name="gender" required className={styles.input} value={formData.gender} onChange={handleChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address *</label>
              <input type="email" name="email" required className={styles.input} value={formData.email} onChange={handleChange} placeholder="Required for digital records" />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Phone Number</label>
              <input type="tel" name="phone_number" className={styles.input} value={formData.phone_number} onChange={handleChange} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Blood Group</label>
              <select name="blood_group" className={styles.input} value={formData.blood_group} onChange={handleChange}>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Address</label>
              <input type="text" name="address" className={styles.input} value={formData.address} onChange={handleChange} />
            </div>

            <div className={styles.formGroupFull}>
              <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', margin: '1rem 0 0.5rem 0' }}>Emergency & Insurance</h3>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Emergency Contact Name</label>
              <input type="text" name="emergency_contact_name" className={styles.input} value={formData.emergency_contact_name} onChange={handleChange} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Emergency Phone</label>
              <input type="tel" name="emergency_contact_phone" className={styles.input} value={formData.emergency_contact_phone} onChange={handleChange} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Insurance Provider</label>
              <input type="text" name="insurance_provider" className={styles.input} value={formData.insurance_provider} onChange={handleChange} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Policy Number</label>
              <input type="text" name="insurance_policy_number" className={styles.input} value={formData.insurance_policy_number} onChange={handleChange} />
            </div>
            
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.btnOutline} onClick={() => router.back()}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
