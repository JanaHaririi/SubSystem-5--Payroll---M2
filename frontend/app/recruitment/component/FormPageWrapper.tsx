import React from 'react';
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';

interface FormPageWrapperProps {
  title: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
}

export default function FormPageWrapper({ 
  title, 
  description, 
  icon = '',
  children 
}: FormPageWrapperProps) {
  return (
    <div className={styles.container}>
      {/* Page Title */}
      <h1 className={styles.pageTitle}>
        {icon} {title}
      </h1>
      <div className={styles.fullLine}></div>

      {/* Optional Description Box */}
      {description && (
        <div style={{
          padding: '20px',
          backgroundColor: '#693699',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '2px solid #693699',
          color: '#ffffff'
        }}>
          <p style={{ margin: 0, lineHeight: '1.6' }}>
            {description}
          </p>
        </div>
      )}

      {/* Form Content */}
      <div style={{
        backgroundColor: '#693699',
        borderRadius: '12px',
        padding: '30px',
        border: '2px solid #7C40A9',
        boxShadow: '0 4px 6px rgba(124, 64, 169, 0.1)'
      }}>
        {children}
      </div>
    </div>
  );
}