"use client";

import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

export default function CreateRequisitionPage() {
  
  const requisitionFields: FieldConfig[] = [
    {
      name: "requisitionId",
      label: "requisition ID",
      type: "text",
      placeholder: "Enter MongoDB requisition ID",
      required: true,
    },
    
    {
      name: "templateId",
      label: "Template ID",
      type: "text",
      placeholder: "Enter MongoDB Template ID",
      required: true,
    },
    {
      name: "openings",
      label: "Number of Openings",
      type: "number",
      placeholder: "e.g., 2",
      required: true,
    },
    {
      name: "location",
      label: "Location",
      type: "text",
      placeholder: "e.g., New York, NY",
      required: true,
    },
    {
      name: "hiringManagerId",
      label: "Hiring Manager ID",
      type: "text",
      placeholder: "Enter MongoDB hiring manager ID",
      required: true,
    },
   {
    name: "publishStatus",
    label: "Publish Status",
    type: "select",
    required: true,
    options: [
      { value: "", label: "-- Select Status --" }, // Placeholder option
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "closed", label: "Closed" },
    ],
  },
    {
      name: "postingDate",
      label: "Posting Date",
      type: "date",
      required: false,
    },
    {
      name: "expiryDate",
      label: "Expiry Date",
      type: "date",
      required: false,
    },
  ];

const handleSubmit = async (data: Record<string, any>) => {
  try {
    console.log('Submitting data:', data); // Log what we're sending
    
    const { templateId, ...requisitionData } = data;
    
    console.log('Template ID:', templateId);
    console.log('Requisition Data:', requisitionData);
    
    const response = await axiosInstance.post(
      `/recruitment/requisitions/${templateId}`,
      requisitionData
    );
    
    alert('Requisition created successfully!');
    console.log('Created:', response.data);
  } catch (error: any) {
    console.error("Full error:", error);
    console.error("Error response:", error.response?.data);
    alert('Error: ' + (error.response?.data?.message || error.message));
  }
};

  return (
   <FormPageWrapper
      title="Create Job Requisition"
      icon=""
    >
      <GenericForm
        fields={requisitionFields}
        onSubmit={handleSubmit}
        submitButtonText="Create Requisition"
      />
    </FormPageWrapper>
  );
}