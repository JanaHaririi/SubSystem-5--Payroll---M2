"use client";

import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

export default function CreateInterviewPage() {
  
 const interviewFields: FieldConfig[] = [
  {
    name: "applicationId",
    label: "Application ID",
    type: "text",
    placeholder: "Enter MongoDB Application ID",
    required: true,
  },
  {
    name: "stage",
    label: "Interview Stage",
    type: "select",
    required: true,
    options: [
      { value: "", label: "-- Select Stage --" },
      { value: "screening", label: "Screening" },
      { value: "hr_interview", label: "HR Interview" },
      { value: "department_interview", label: "Department Interview" },
      { value: "offer", label: "Offer" },
    ],
  },
  {
    name: "scheduledDate",
    label: "Scheduled Date",
    type: "date",
    required: true,
  },
  {
    name: "method",
    label: "Interview Method",
    type: "select",
    required: true,
    options: [
      { value: "", label: "-- Select Method --" },
      { value: "phone", label: "Phone" },
      { value: "video", label: "Video Call" },
      { value: "onsite", label: "On-site" },
    ],
  },
  {
    name: "panel",
    label: "Panel Member IDs",
    type: "text",
    placeholder: "Enter panel member IDs (comma-separated)",
    required: false,
  },
  {
    name: "videoLink",
    label: "Video Link",
    type: "text",
    placeholder: "Enter video meeting link (optional)",
    required: false,
  },
  {
    name: "candidateFeedback",
    label: "Candidate Feedback",
    type: "textarea",
    placeholder: "Enter any candidate feedback (optional)",
    required: false,
  },
];

  const handleSubmit = async (data: Record<string, any>) => {
  try {
    console.log('=== RAW FORM DATA ===');
    console.log(data);
    
    // Convert panel string to array of IDs if provided
    if (data.panel && typeof data.panel === 'string') {
      data.panel = data.panel.split(',').map((id: string) => id.trim()).filter(Boolean);
    }
    
    // Convert date to ISO format if provided
    if (data.scheduledDate) {
      data.scheduledDate = new Date(data.scheduledDate).toISOString();
    }
    
    // FORCE status to be lowercase 'scheduled' to override backend default
    data.status = 'scheduled';
    
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
      '/recruitment/interviews',
      cleanedData
    );
    
    alert('Interview created successfully!');
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
      title="Create Interview"
    >
      <GenericForm
        fields={interviewFields}
        onSubmit={handleSubmit}
        submitButtonText="Create Interview"
      />
    </FormPageWrapper>
  );
}