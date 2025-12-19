"use client";

import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateTerminationRequestPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const terminationFields: FieldConfig[] = [
    {
      name: "employeeId",
      label: "Employee ID",
      type: "text",
      placeholder: "Enter MongoDB employee ID (e.g., 507f1f77bcf86cd799439011)",
      required: true,
    },
    {
      name: "initiator",
      label: "Initiator",
      type: "select",
      required: true,
      options: [
        { value: "", label: "Select initiator" },
        { value: "employee", label: "Employee" },
        { value: "manager", label: "Manager" },
        { value: "hr", label: "HR" },
      ],
    },
    {
      name: "terminationDate",
      label: "Termination Date",
      type: "date",
      required: false,
    },
    {
      name: "contractId",
      label: "Contract ID",
      type: "text",
      placeholder: "Enter MongoDB contract ID",
      required: true,
    },
    {
      name: "reason",
      label: "Reason",
      type: "textarea",
      placeholder: "Provide detailed reason for termination",
      required: true,
    },
    {
      name: "employeeComments",
      label: "Employee Comments",
      type: "textarea",
      placeholder: "Comments from the employee (optional)",
      required: false,
    },
    {
      name: "hrComments",
      label: "HR Comments",
      type: "textarea",
      placeholder: "Comments from HR (optional)",
      required: false,
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    setError(null);

    try {
      // Clean and prepare payload
      const payload = {
        employeeId: data.employeeId.trim(),
        initiator: data.initiator,
        reason: data.reason.trim(),
        employeeComments: data.employeeComments?.trim() || undefined,
        hrComments: data.hrComments?.trim() || undefined,
        terminationDate: data.terminationDate || undefined,
        contractId: data.contractId.trim(),
        status: "pending"
      };

      console.log(" Sending payload:");
      console.table(payload);
      console.log(JSON.stringify(payload, null, 2));

      const response = await axiosInstance.post("/offboarding/requests", payload);
      
      console.log(" Success:", response.data);
      alert(" Termination request created successfully!");
    } catch (err: any) {
      console.error(" Full error:", err);
      console.error(" Status:", err.response?.status);
      console.log(" Error data:");
      console.table(err.response?.data);
      console.log(JSON.stringify(err.response?.data, null, 2));
      
      // Extract detailed error message
      let errorMsg = "Failed to create termination request";
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Handle validation errors (array of messages)
        if (Array.isArray(data.message)) {
          errorMsg = "Validation errors:\n" + data.message.map((msg: string, i: number) => `${i + 1}. ${msg}`).join("\n");
        } 
        // Handle single error message
        else if (data.message) {
          errorMsg = data.message;
        }
        // Handle error property
        else if (data.error) {
          errorMsg = `Error: ${data.error}`;
        }
      }
      
      console.error(" Final error message:", errorMsg);
      setError(errorMsg);
      alert(" " + errorMsg);
    }
  };

  return (
    <FormPageWrapper
      title="Create Termination Request"
      icon=""
    >
      {error && (
        <div style={{ 
          padding: '16px', 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '2px solid #ef4444', 
          borderRadius: '8px',
          color: '#ffffff',
          marginBottom: '20px',
          fontSize: '14px',
          whiteSpace: 'pre-line'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      <GenericForm
        fields={terminationFields}
        onSubmit={handleSubmit}
        submitButtonText="Create Request"
        showResetButton={true}
      />

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            color: '#ffffff',
            border: '2px solid #ffffff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ← Back to Termination Requests
        </button>
      </div>
    </FormPageWrapper>
  );
}