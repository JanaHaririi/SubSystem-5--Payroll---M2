"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import axiosInstance from "@/app/utils/ApiClient";

function CreateContractContent() {
  const searchParams = useSearchParams();
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const offerId = searchParams.get('offerId');
    
    if (offerId) {
      setInitialValues({
        offerId: offerId,
      });
    }
  }, [searchParams]);

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
      label: "Contract Acceptance Date",
      type: "date",
      required: true,
    },
    {
      name: "grossSalary",
      label: "Gross Salary",
      type: "number",
      placeholder: "e.g., 80000",
      required: true,
    },
    {
      name: "signingBonus",
      label: "Signing Bonus",
      type: "number",
      placeholder: "e.g., 5000 (optional)",
      required: false,
    },
    {
      name: "role",
      label: "Role/Position",
      type: "text",
      placeholder: "e.g., Senior Software Engineer",
      required: false,
    },
    {
      name: "benefits",
      label: "Benefits",
      type: "text",
      placeholder: "Enter benefits (comma-separated)",
      required: false,
    },
    {
      name: "documentId",
      label: "Contract Document ID",
      type: "text",
      placeholder: "Enter document ID",
      required: true,
    },
    {
      name: "employerSignatureUrl",
      label: "Employer Signature URL",
      type: "text",
      placeholder: "Enter employer signature URL",
      required: true,
    },
    // {
    //   name: "employeeSignedAt",
    //   label: "Employee Signed Date",
    //   type: "date",
    //   required: true,
    // },
    {
      name: "employerSignedAt",
      label: "Employer Signed Date",
      type: "date",
      required: true,
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      console.log('=== RAW FORM DATA ===');
      console.log(data);
      
      // Convert benefits string to array if provided
      if (data.benefits && typeof data.benefits === 'string') {
        data.benefits = data.benefits.split(',').map((benefit: string) => benefit.trim()).filter(Boolean);
      }
      
      // Convert dates to ISO format
      const dateFields = ['acceptanceDate', 'employeeSignedAt', 'employerSignedAt'];
      dateFields.forEach(field => {
        if (data[field]) {
          data[field] = new Date(data[field]).toISOString();
        }
      });
      
      // Convert salary fields to numbers
      if (data.grossSalary) {
        data.grossSalary = Number(data.grossSalary);
      }
      if (data.signingBonus) {
        data.signingBonus = Number(data.signingBonus);
      }
      
      // Remove empty optional fields
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => {
          if (value === '' || value === null || value === undefined) return false;
          if (Array.isArray(value) && value.length === 0) return false;
          return true;
        })
      );
      
      console.log('=== CLEANED DATA TO SEND ===');
      console.log(JSON.stringify(cleanedData, null, 2));
      
      const response = await axiosInstance.post(
        '/onboarding/contracts',
        cleanedData
      );
      
      alert('✅ Contract created successfully!');
      console.log('Created:', response.data);
      
      // Redirect to offers dashboard
      window.location.href = '/hr/offers';
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
      fields={contractFields}
      onSubmit={handleSubmit}
      submitButtonText="Create Contract"
      initialValues={initialValues}
      key={JSON.stringify(initialValues)}
    />
  );
}

export default function CreateContractPage() {
  return (
    <div style={{ padding: '40px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px', color: '#1e293b' }}>
        Create Contract
      </h1>
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fef3c7', 
        borderRadius: '8px', 
        marginBottom: '24px',
        border: '2px solid #f59e0b'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#92400e', fontSize: '18px', fontWeight: '600' }}>
          📝 Contract Information
        </h3>
        <p style={{ margin: 0, color: '#78350f', lineHeight: '1.6' }}>
          Create a contract linked to an existing offer. The Offer ID will be pre-filled if you came from the offer page.
        </p>
      </div>
      <Suspense fallback={<div>Loading form...</div>}>
        <CreateContractContent />
      </Suspense>
    </div>
  );
}