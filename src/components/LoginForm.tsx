'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { DEMO_USERS } from '@/utils/demoAuth';
import styles from './LoginForm.module.css';

interface LoginFormProps {
  portalName: string;
  placeholder: string;
  moduleKey: string;
}

export default function LoginForm({ portalName, placeholder, moduleKey }: LoginFormProps) {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState<{loginId?: string; password?: string}>({});
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    const newErrors: {loginId?: string; password?: string} = {};
    if (!loginId.trim()) newErrors.loginId = 'Login ID is required';
    if (!password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // DEMO AUTHENTICATION LOGIC
      const demoUser = DEMO_USERS[moduleKey as keyof typeof DEMO_USERS];
      
      if (demoUser && loginId === demoUser.id && password === demoUser.pass) {
        document.cookie = `demo_auth=${moduleKey}; path=/; max-age=86400`; // 1 day
        router.push(`/${moduleKey}/dashboard`);
        return;
      } else {
        // Since we are in strict demo mode, reject anything else
        setGeneralError(`Invalid Demo Credentials. Hint: Use ID ${demoUser?.id || 1} and Password ${demoUser?.pass || 1}`);
        return;
      }
    } catch (err: any) {
      setGeneralError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>{portalName}</h2>
        <p className={styles.subtitle}>Please sign in using your authorized credentials.</p>
      </div>

      <form className={styles.form} onSubmit={handleLogin}>
        {generalError && (
          <div className={styles.generalError}>{generalError}</div>
        )}

        <div className={styles.inputGroup}>
          <label htmlFor="loginId" className={styles.label}>Login ID</label>
          <div className={styles.inputWrapper}>
            <input
              id="loginId"
              type="text"
              className={`${styles.input} ${errors.loginId ? styles.error : ''}`}
              placeholder={placeholder}
              value={loginId}
              onChange={(e) => {
                setLoginId(e.target.value);
                if (errors.loginId) setErrors(prev => ({ ...prev, loginId: undefined }));
              }}
            />
          </div>
          {errors.loginId && <span className={styles.errorMessage}>{errors.loginId}</span>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>Password</label>
          <div className={styles.inputWrapper}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`${styles.input} ${errors.password ? styles.error : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              }}
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <span className={styles.errorMessage}>{errors.password}</span>}
        </div>

        <div className={styles.options}>
          <label className={styles.checkboxGroup}>
            <input type="checkbox" className={styles.checkbox} />
            <span>Remember Me</span>
          </label>
          <Link href="#" className={styles.forgotLink}>Forgot Password?</Link>
        </div>

        <button 
          type="submit" 
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>

        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Portal Selection
        </Link>
      </form>
    </div>
  );
}
