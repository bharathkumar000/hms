'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LucideIcon } from 'lucide-react';
import styles from './ModuleCard.module.css';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

export default function ModuleCard({ title, description, icon: Icon, href }: ModuleCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <div className={styles.card} onClick={handleClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleClick()}>
      <div className={styles.iconContainer}>
        <Icon className={styles.icon} size={32} strokeWidth={1.5} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.action}>
        <span className={styles.actionText}>Open {title}</span>
        <ArrowRight className={styles.actionIcon} size={18} />
      </div>
    </div>
  );
}
