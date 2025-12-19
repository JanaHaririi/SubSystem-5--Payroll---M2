"use client";

import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

export default function CreateReferralPage() {
  
  const referralFields: FieldConfig[] = [
    {
      name: "referringEmployeeId",
      label: "Referring Employee ID",
      type: "text",
      placeholder: "Enter MongoDB Employee ID",
      required: true,
    },
    {
      name: "candidateId",
      label: "Candidate ID",
      type: "text",
      placeholder: "Enter MongoDB Candidate ID",
      required: true,
    },
    {
      name: "role",
      label: "Role",
      type: "text",
      placeholder: "Enter job role (e.g., Software Engineer, Product Manager)",
      required: false,
    },
    {
      name: "level",
      label: "Level",
      type: "select",
      required: false,
      options: [
        { value: "", label: "-- Select Level --" },
        { value: "junior", label: "Junior" },
        { value: "mid", label: "Mid-Level" },
        { value: "senior", label: "Senior" },
        { value: "lead", label: "Lead" },
        { value: "principal", label: "Principal" },
        { value: "staff", label: "Staff" },
      ],
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      console.log('=== RAW FORM DATA ===');
      console.log(data);
      
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
        '/recruitment/referrals',
        cleanedData
      );
      
      alert('Referral created successfully!');
      console.log('Created:', response.data);
    } catch (error: any) {
      console.error('=== ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <FormPageWrapper
      title="Create Employee Referral"
      
      icon=""
    >
      <GenericForm
        fields={referralFields}
        onSubmit={handleSubmit}
        submitButtonText="Submit Referral"
      />
    </FormPageWrapper>
  );
}