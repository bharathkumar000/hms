import { 
  UserRound, 
  Stethoscope, 
  ClipboardList, 
  FlaskConical, 
  Pill, 
  ShieldCheck,
  Hospital,
  Receipt
} from 'lucide-react';
import styles from './login.module.css';
import LoginForm from '@/components/LoginForm';

// Map configuration for each portal
const PORTAL_CONFIG: Record<string, any> = {
  patient: {
    name: 'Patient Portal',
    icon: UserRound,
    placeholder: 'Enter Patient ID / UHID / Email'
  },
  doctor: {
    name: 'Doctor Portal',
    icon: Stethoscope,
    placeholder: 'Enter Doctor ID'
  },
  reception: {
    name: 'Reception Portal',
    icon: ClipboardList,
    placeholder: 'Enter Employee ID'
  },
  laboratory: {
    name: 'Laboratory Portal',
    icon: FlaskConical,
    placeholder: 'Enter Lab Employee ID'
  },
  pharmacy: {
    name: 'Pharmacy Portal',
    icon: Pill,
    placeholder: 'Enter Pharmacist ID'
  },
  admin: {
    name: 'Admin Portal',
    icon: ShieldCheck,
    placeholder: 'Enter Admin ID'
  },
  billing: {
    name: 'Billing & Finance Portal',
    icon: Receipt,
    placeholder: 'Enter Billing ID'
  }
};

export default async function LoginPage({ params }: { params: Promise<{ module: string }> }) {
  const resolvedParams = await params;
  const moduleKey = resolvedParams.module.toLowerCase();
  
  // Fallback to a default config if the module is unknown
  const config = PORTAL_CONFIG[moduleKey] || {
    name: `${resolvedParams.module} Portal`,
    icon: Hospital,
    placeholder: 'Enter ID'
  };

  const IconComponent = config.icon;

  return (
    <div className={styles.container}>
      {/* Left Panel: Branding & Illustration */}
      <div className={styles.leftPanel}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Hospital size={32} />
            <span>Hospital Management System</span>
          </div>
          <h1 className={styles.portalTitle}>{config.name}</h1>
          <p className={styles.welcomeText}>
            Welcome Back.<br/>
            Sign in securely to continue accessing your hospital services.
          </p>
        </div>
        
        <div className={styles.illustrationContainer}>
          <div className={styles.abstractShape}>
            <IconComponent size={120} color="var(--color-primary)" opacity={0.8} strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* Right Panel: Premium Login Card */}
      <div className={styles.rightPanel}>
        <LoginForm 
          portalName={config.name}
          placeholder={config.placeholder}
          moduleKey={moduleKey}
        />
      </div>
    </div>
  );
}
