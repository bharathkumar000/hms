'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import styles from './ModalProvider.module.css';
import { AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';

type ModalType = 'alert' | 'confirm';

interface ModalOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface ModalContextType {
  showAlert: (message: string | ModalOptions) => void;
  showConfirm: (message: string | ModalOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('alert');
  const [options, setOptions] = useState<ModalOptions>({ message: '' });
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>();

  const showAlert = (messageOrOptions: string | ModalOptions) => {
    const opts = typeof messageOrOptions === 'string' ? { message: messageOrOptions } : messageOrOptions;
    setOptions(opts);
    setModalType('alert');
    setIsOpen(true);
  };

  const showConfirm = (messageOrOptions: string | ModalOptions): Promise<boolean> => {
    const opts = typeof messageOrOptions === 'string' ? { message: messageOrOptions } : messageOrOptions;
    setOptions(opts);
    setModalType('confirm');
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(false);
  };

  const getIcon = () => {
    if (modalType === 'confirm') return <HelpCircle size={32} className={styles.iconConfirm} />;
    
    switch (options.type) {
      case 'success': return <CheckCircle2 size={32} className={styles.iconSuccess} />;
      case 'warning': return <AlertCircle size={32} className={styles.iconWarning} />;
      case 'error': return <AlertCircle size={32} className={styles.iconError} />;
      default: return <AlertCircle size={32} className={styles.iconInfo} />;
    }
  };

  const getTitle = () => {
    if (options.title) return options.title;
    if (modalType === 'confirm') return 'Confirm Action';
    switch (options.type) {
      case 'success': return 'Success';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      default: return 'Information';
    }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {isOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal} role="dialog" aria-modal="true">
            <button className={styles.closeBtn} onClick={handleCancel}>
              <X size={20} />
            </button>
            
            <div className={styles.header}>
              {getIcon()}
              <h2 className={styles.title}>{getTitle()}</h2>
            </div>
            
            <div className={styles.body}>
              <p>{options.message}</p>
            </div>
            
            <div className={styles.footer}>
              {modalType === 'confirm' && (
                <button className={styles.btnCancel} onClick={handleCancel}>
                  Cancel
                </button>
              )}
              <button 
                className={`${styles.btnConfirm} ${modalType === 'confirm' ? styles.btnDanger : styles.btnPrimary}`} 
                onClick={handleConfirm}
              >
                {modalType === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
