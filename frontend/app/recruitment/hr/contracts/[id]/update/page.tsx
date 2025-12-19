"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import axiosInstance from "@/app/utils/ApiClient";

export default function UpdateContractPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await axiosInstance.get(`/onboarding/contracts/${id}`);
        const contract = response.data;
        
        // Format contract data for the form
        const formattedContract = {
          // Handle offerId - extract string ID if it's an object
          offerId: contract.offerId?._id || contract.offerId || '',
          
          // Format acceptanceDate to YYYY-MM-DD
          acceptanceDate: contract.acceptanceDate 
            ? new Date(contract.acceptanceDate).toISOString().split('T')[0]
            : '',
          
          // Salary fields
          grossSalary: contract.grossSalary || '',
          signingBonus: contract.signingBonus || '',
          
          // Role
          role: contract.role || '',
          
          // Convert benefits array to comma-separated string
          benefits: Array.isArray(contract.benefits) 
            ? contract.benefits.join(', ') 
            : contract.benefits || '',
          
          // Document ID - extract string ID if it's an object
          documentId: contract.documentId?._id || contract.documentId || '',
          
          // Employer signature fields only (HR fields)
          employerSignatureUrl: contract.employerSignatureUrl || '',
          employerSignedAt: contract.employerSignedAt 
            ? new Date(contract.employerSignedAt).toISOString().split('T')[0]
            : '',
        };
        
        setInitialData(formattedContract);
      } catch (error) {
        console.error("Error fetching contract:", error);
        alert("Failed to load contract");
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [id]);

  // Form fields matching the DTO (excluding employee fields)
  const contractFields: FieldConfig[] = [
    {
      name: "offerId",
      label: "Offer ID",
      type: "text",
      placeholder: "Enter MongoDB Offer ID",
      required: true,
    },
    {
      name: "acceptanceDate",
      label: "Acceptance Date",
      type: "date",
      required: false,
    },
    {
      name: "grossSalary",
      label: "Gross Salary",
      type: "number",
      placeholder: "Enter gross salary amount",
      required: true,
    },
    {
      name: "signingBonus",
      label: "Signing Bonus",
      type: "number",
      placeholder: "Enter signing bonus (optional)",
      required: false,
    },
    {
      name: "role",
      label: "Role/Position",
      type: "text",
      placeholder: "Enter job role/position",
      required: false,
    },
    {
      name: "benefits",
      label: "Benefits",
      type: "textarea",
      placeholder: "Enter benefits (comma-separated, e.g., Health Insurance, Dental, 401k)",
      required: false,
    },
    {
      name: "documentId",
      label: "Document ID",
      type: "text",
      placeholder: "Enter associated document ID (optional)",
      required: false,
    },
    {
      name: "employerSignatureUrl",
      label: "Employer Signature URL",
      type: "text",
      placeholder: "Enter employer signature URL (optional)",
      required: false,
    },
    {
      name: "employerSignedAt",
      label: "Employer Signed Date",
      type: "date",
      required: false,
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      // Convert benefits string to array if provided
      if (data.benefits && typeof data.benefits === 'string') {
        data.benefits = data.benefits
          .split(',')
          .map((benefit: string) => benefit.trim())
          .filter(Boolean);
      }
      
      // Convert dates to ISO format if provided
      if (data.acceptanceDate) {
        data.acceptanceDate = new Date(data.acceptanceDate).toISOString();
      }
      if (data.employerSignedAt) {
        data.employerSignedAt = new Date(data.employerSignedAt).toISOString();
      }
      
      // Convert salary fields to numbers
      if (data.grossSalary) {
        data.grossSalary = Number(data.grossSalary);
      }
      if (data.signingBonus) {
        data.signingBonus = Number(data.signingBonus);
      }
      
      // Remove empty strings to avoid overwriting with empty values
      Object.keys(data).forEach(key => {
        if (data[key] === '') {
          delete data[key];
        }
      });
      
      const response = await axiosInstance.patch(
        `/onboarding/contracts/${id}`,
        data
      );
      alert('Contract updated successfully!');
      console.log('Updated:', response.data);
      router.push('/recruitment/hr/offers');
    } catch (error: any) {
      console.error("Error:", error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: '#f5f7fa',
        minHeight: '100vh'
      }}>
        <div style={{ fontSize: '18px', color: '#64748b' }}>Loading contract...</div>
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
          Contract not found
        </div>
        <button
          onClick={() => router.push('/recruitment/hr/contracts')}
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
          Back to Contracts
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
            Update Contract
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
            Update contract details - HR use only
          </p>
        </div>
        <GenericForm
          fields={contractFields}
          onSubmit={handleSubmit}
          submitButtonText="Update Contract"
          initialValues={initialData}
        />
      </div>
    </div>
  );
}