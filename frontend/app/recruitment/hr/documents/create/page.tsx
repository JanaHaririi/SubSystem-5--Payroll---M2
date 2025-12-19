// app/hr/documents/create/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";

function CreateDocumentPageForm() {
  const searchParams = useSearchParams();
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const contractId = searchParams.get('contractId');
    const offerId = searchParams.get('offerId');
    const type = searchParams.get('type');
    const ownerId = searchParams.get('ownerId');
    
    setInitialValues({
      type: 'contract', // Always contract
      ...(ownerId && { ownerId }), // Pre-fill ownerId if provided
    });
  }, [searchParams]);

  const documentFields: FieldConfig[] = [
    {
      name: "type",
      label: "Document Type",
      type: "select",
      required: true,
      options: [
        { value: "contract", label: "Contract" },
      ],
    },
    {
      name: "documentName",
      label: "Document Name",
      type: "text",
      placeholder: "Enter document name (e.g., Employment Contract - John Doe)",
      required: true,
    },
    {
      name: "filePath",
      label: "File Path",
      type: "text",
      placeholder: "Enter document file path or URL",
      required: true,
    },
    {
      name: "ownerId",
      label: "Owner ID (Optional)",
      type: "text",
      placeholder: "Enter MongoDB Owner ID (Candidate or Employee)",
      required: false,
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      console.log('=== RAW FORM DATA ===');
      console.log(data);
      
      // Force type to be 'contract'
      data.type = 'contract';
      
      // Remove empty optional fields
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => {
          if (value === '' || value === null || value === undefined) return false;
          return true;
        })
      );
      
      console.log('=== CLEANED DATA TO SEND ===');
      console.log(JSON.stringify(cleanedData, null, 2));
      
      const response = await axiosInstance.post(
        '/onboarding/documents',
        cleanedData
      );
      
      console.log('✅ Document created:', response.data);
      
      // If we have a contractId, update the contract with this document ID
      const contractId = searchParams.get('contractId');
      if (contractId && response.data._id) {
        try {
          await axiosInstance.patch(`/onboarding/contracts/${contractId}`, {
            documentId: response.data._id,
          });
          console.log('✅ Contract updated with document ID');
        } catch (err) {
          console.error('Failed to update contract:', err);
        }
      }
      
      alert('✅ Document created successfully!');
      
      // Redirect to offers dashboard
      window.location.href = '/recruitment/hr/offers';
    } catch (error: any) {
      console.error('=== ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <GenericForm
      fields={documentFields}
      onSubmit={handleSubmit}
      submitButtonText="Create Contract Document"
      initialValues={initialValues}
      key={JSON.stringify(initialValues)}
    />
  );
}

export default function CreateDocumentPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Create Contract Document</h1>
      <div className={styles.fullLine}></div>

      {/* Info Banner */}
      <div style={{
        backgroundColor: '#9570DD',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: '3px solid #7C40A9'
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          color: '#ffffff', 
          fontSize: '18px', 
          fontWeight: '700',
          fontFamily: 'Roboto, sans-serif'
        }}>
          📄 Contract Document Information
        </h3>
        <p style={{ 
          margin: '0 0 8px 0', 
          color: '#ffffff', 
          lineHeight: '1.6',
          fontFamily: 'Roboto Condensed, sans-serif'
        }}>
          Create a contract document. This document will be automatically linked to the contract.
        </p>
        <p style={{ 
          margin: 0, 
          color: '#e9d5ff', 
          lineHeight: '1.6', 
          fontSize: '14px',
          fontFamily: 'Roboto Condensed, sans-serif'
        }}>
          <strong style={{ fontWeight: '700' }}>Note:</strong> Document type is fixed to <strong style={{ fontWeight: '700' }}>Contract</strong> only.
        </p>
      </div>

      {/* Form Content Wrapper */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '30px',
        border: '2px solid #9570DD',
        boxShadow: '0 4px 6px rgba(124, 64, 169, 0.1)'
      }}>
        <Suspense fallback={
          <div className={styles.loading}>
            Loading form...
          </div>
        }>
          <CreateDocumentPageForm />
        </Suspense>
      </div>
    </div>
  );
}