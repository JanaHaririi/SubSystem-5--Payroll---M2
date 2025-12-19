"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import axiosInstance from "@/app/utils/ApiClient";

export default function UpdateDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await axiosInstance.get(`/onboarding/documents/${id}`);
        const document = response.data;
        
        console.log('Fetched document:', document); // Debug log
        
        // Handle ownerId - extract string ID if it's an object
        if (document.ownerId && typeof document.ownerId === 'object') {
          document.ownerId = document.ownerId._id;
        }
        
        // Format uploadedAt date to YYYY-MM-DD for date input
        if (document.uploadedAt) {
          document.uploadedAt = new Date(document.uploadedAt).toISOString().split('T')[0];
        }
        
        console.log('Formatted document:', document); // Debug log
        setInitialData(document);
      } catch (error) {
        console.error("Error fetching document:", error);
        alert("Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

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
      
      const response = await axiosInstance.patch(
        `/onboarding/documents/${id}`,
        cleanedData
      );
      
      console.log('✅ Document updated:', response.data);
      alert('✅ Document updated successfully!');
      router.push('/recruitment/hr/documents');
    } catch (error: any) {
      console.error('=== ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert('❌ Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: '#f5f7fa',
        minHeight: '100vh'
      }}>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Loading document...</div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div style={{ 
        padding: '40px',
        backgroundColor: '#f5f7fa',
        minHeight: '100vh'
      }}>
        <div style={{ 
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          color: '#991b1b'
        }}>
          Document not found
        </div>
        <button
          onClick={() => router.push('/hr/documents')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#475569',
              marginBottom: '16px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: '32px', margin: 0, color: '#1e293b', fontWeight: '700' }}>
            Update Contract Document
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
            Update contract document details - HR use only
          </p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f3e8ff', 
          borderRadius: '8px', 
          marginBottom: '24px',
          border: '2px solid #8b5cf6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#581c87', fontSize: '18px', fontWeight: '600' }}>
            📄 Contract Document Information
          </h3>
          <p style={{ margin: '0 0 8px 0', color: '#6b21a8', lineHeight: '1.6' }}>
            Update the contract document details below.
          </p>
          <p style={{ margin: 0, color: '#6b21a8', lineHeight: '1.6', fontSize: '14px' }}>
            <strong>Note:</strong> Document type is fixed to <strong>Contract</strong> only.
          </p>
        </div>
        
        <GenericForm
          fields={documentFields}
          onSubmit={handleSubmit}
          submitButtonText="Update Contract Document"
          initialValues={initialData}
          key={JSON.stringify(initialData)} // Force re-render when data loads
        />
      </div>
    </div>
  );
}