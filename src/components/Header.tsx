import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Hospital Management System</h1>
      <h2 className={styles.subtitle}>Choose Your Portal</h2>
      <p className={styles.description}>
        Select the appropriate portal to securely access your hospital management services.
      </p>
    </header>
  );
}
