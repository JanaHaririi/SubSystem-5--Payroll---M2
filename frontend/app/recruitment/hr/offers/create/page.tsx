"use client";

import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";
export default function CreateOfferPage() {
  
  const offerFields: FieldConfig[] = [
    {
      name: "applicationId",
      label: "Application ID",
      type: "text",
      placeholder: "Enter MongoDB Application ID",
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
      name: "hrEmployeeId",
      label: "HR Employee ID",
      type: "text",
      placeholder: "Enter MongoDB HR Employee ID",
      required: false,
    },
    {
      name: "role",
      label: "Role/Position",
      type: "text",
      placeholder: "e.g., Senior Software Engineer",
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
      name: "benefits",
      label: "Benefits",
      type: "text",
      placeholder: "Enter benefits (comma-separated)",
      required: false,
    },
    {
      name: "insurances",
      label: "Insurances",
      type: "text",
      placeholder: "Enter insurance details",
      required: false,
    },
    {
      name: "conditions",
      label: "Conditions",
      type: "textarea",
      placeholder: "Enter any conditions or terms",
      required: false,
    },
    {
      name: "content",
      label: "Offer Content",
      type: "textarea",
      placeholder: "Enter the full offer letter content",
      required: true,
    },
    {
      name: "deadline",
      label: "Response Deadline",
      type: "date",
      required: true,
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
      
      // Convert dates to ISO format if provided
      const dateFields = ['deadline', 'acceptanceDate', 'employeeSignedAt', 'employerSignedAt'];
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
      
      // Separate offer and contract data
      const offerData = {
        applicationId: data.applicationId,
        candidateId: data.candidateId,
        hrEmployeeId: data.hrEmployeeId,
        role: data.role,
        grossSalary: data.grossSalary,
        signingBonus: data.signingBonus,
        benefits: data.benefits,
        insurances: data.insurances,
        conditions: data.conditions,
        content: data.content,
        deadline: data.deadline,
        applicantResponse: 'pending',
        finalStatus: 'pending',
      };

      const contractData = {
        acceptanceDate: data.acceptanceDate,
        grossSalary: data.grossSalary,
        signingBonus: data.signingBonus,
        role: data.role,
        benefits: data.benefits,
        documentId: data.documentId,
        employerSignatureUrl: data.employerSignatureUrl,
        employeeSignedAt: data.employeeSignedAt,
        employerSignedAt: data.employerSignedAt,
      };
      
      // Remove empty optional fields from both
      const cleanOfferData = Object.fromEntries(
        Object.entries(offerData).filter(([_, value]) => {
          if (value === '' || value === null || value === undefined) return false;
          if (Array.isArray(value) && value.length === 0) return false;
          return true;
        })
      );

      const cleanContractData = Object.fromEntries(
        Object.entries(contractData).filter(([_, value]) => {
          if (value === '' || value === null || value === undefined) return false;
          if (Array.isArray(value) && value.length === 0) return false;
          return true;
        })
      );
      
      console.log('=== CLEANED OFFER DATA ===');
      console.log(JSON.stringify(cleanOfferData, null, 2));
      console.log('=== CLEANED CONTRACT DATA ===');
      console.log(JSON.stringify(cleanContractData, null, 2));
      
      // First, create the offer
      const offerResponse = await axiosInstance.post(
        '/recruitment/offers',
        cleanOfferData
      );
      
      console.log(' Offer created:', offerResponse.data);
      
      // Then, ALWAYS create the contract with the offer ID
      cleanContractData.offerId = offerResponse.data._id;
      
      const contractResponse = await axiosInstance.post(
        '/onboarding/contracts',
        cleanContractData
      );
      
      console.log(' Contract created:', contractResponse.data);
      alert(' Offer and Contract created successfully!');
      
    } catch (error: any) {
      console.error('=== ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(' Error: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
        <FormPageWrapper
      title="Create Job Offer & Contract"
      description="This form will create both an Offer and a Contract simultaneously. All required fields must be completed before submission."
      icon=""
    >
      <GenericForm
        fields={offerFields}
        onSubmit={handleSubmit}
        submitButtonText="Create Offer & Contract"
      />
    </FormPageWrapper>
  );
}