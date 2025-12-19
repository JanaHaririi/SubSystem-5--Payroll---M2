"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import axiosInstance from "@/app/utils/ApiClient";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';

function CreateDocumentPageForm() {
  const searchParams = useSearchParams();
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const contractId = searchParams.get('contractId');
    const offerId = searchParams.get('offerId');
    const type = searchParams.get('type');
    const candidateId = searchParams.get('candidateId');
    
    const initialData: Record<string, any> = {
      type: type || 'id',
    };
    
    // Pre-fill ownerId if candidateId is provided in URL
    if (candidateId) {
      initialData.ownerId = candidateId;
    }
    
    setInitialValues(initialData);
  }, [searchParams]);

  const documentFields: FieldConfig[] = [
    {
      name: "type",
      label: "Document Type",
      type: "select",
      required: true,
      options: [
        { value: "id", label: "ID" },
        { value: "certificate", label: "Certificate" },
      ],
    },
    {
      name: "documentName",
      label: "Document Name",
      type: "text",
      placeholder: "Enter document name (e.g., National ID - John Doe)",
      required: false,
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
      label: "Owner ID (Your User ID)",
      type: "text",
      placeholder: "Enter MongoDB User ID",
      required: false,
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      console.log('=== RAW FORM DATA ===');
      console.log(data);
      
      // Ensure ownerId from URL is included if not in form
      const candidateIdFromUrl = searchParams.get('candidateId');
      if (candidateIdFromUrl && !data.ownerId) {
        data.ownerId = candidateIdFromUrl;
      }
      
      // Remove empty optional fields, but keep required fields like type
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => {
          // Always keep required fields
          if (key === 'type' || key === 'filePath') {
            return true;
          }
          // Keep ownerId and documentName if present
          if ((key === 'ownerId' || key === 'documentName') && value) {
            return true;
          }
          // Remove empty optional fields
          if (value === '' || value === null || value === undefined) return false;
          return true;
        })
      );
      
      // Ensure type has a default value if missing
      if (!cleanedData.type) {
        console.warn('⚠️ Type is missing! Setting default to "id"');
        cleanedData.type = 'id';
      }
      
      // Validate that type is present before sending
      if (!cleanedData.type) {
        alert('❌ Error: Document type is required but missing!');
        console.error('Type field is still missing after default assignment');
        return;
      }
      
      console.log('=== CLEANED DATA TO SEND ===');
      console.log(JSON.stringify(cleanedData, null, 2));
      console.log('Type value:', cleanedData.type);
      console.log('Type is present?', !!cleanedData.type);
      
      console.log('=== SENDING REQUEST ===');
      console.log('URL:', '/onboarding/documents');
      console.log('Method: POST');
      
      const response = await axiosInstance.post(
        '/onboarding/documents',
        cleanedData
      );
      
      console.log('=== ✅ RESPONSE RECEIVED ===');
      console.log('Status:', response.status);
      console.log('✅ Document created:', response.data);
      console.log('Document ID:', response.data._id);
      console.log('Document ownerId:', response.data.ownerId);
      console.log('Document type:', response.data.type);
      
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
      
      // Reset form
      window.location.reload();
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
      submitButtonText="Create Document"
      initialValues={initialValues}
      key={JSON.stringify(initialValues)}
    />
  );
}

export default function CreateDocumentPage() {
  return (
    <div className={styles.container}>
      {/* Page Title */}
      <h1 className={styles.pageTitle}>
        Create Document
      </h1>
      <div className={styles.fullLine}></div>

      {/* Description Box */}
      <div style={{
        padding: '20px',
        backgroundColor: '#9570DD',
        borderRadius: '12px',
        marginBottom: '30px',
        border: '2px solid #693699',
        color: '#ffffff'
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '18px', 
          fontWeight: '700',
          color: '#ffffff'
        }}>
          Document Information
        </h3>
        <p style={{ margin: '0 0 8px 0', lineHeight: '1.6' }}>
          Create a document for candidates or employees. Choose between ID or Certificate type.
        </p>
        <p style={{ margin: 0, lineHeight: '1.6', fontSize: '14px' }}>
          <strong>Available Types:</strong> ID, Certificate
        </p>
      </div>

      {/* Form Content Wrapper */}
      <div style={{
        backgroundColor: '#9570DD',
        borderRadius: '12px',
        padding: '30px',
        border: '2px solid #7C40A9',
        boxShadow: '0 4px 6px rgba(124, 64, 169, 0.1)'
      }}>
        <Suspense fallback={
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#2d1b4e',
            fontSize: '16px'
          }}>
            Loading form...
          </div>
        }>
          <CreateDocumentPageForm />
        </Suspense>
      </div>
    </div>
  );
}