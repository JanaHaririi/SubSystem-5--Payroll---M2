"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

export default function CreateFeedbackPage() {
  const searchParams = useSearchParams();
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const interviewId = searchParams.get('interviewId');
    const interviewerId = searchParams.get('interviewerId');
    
    if (interviewId || interviewerId) {
      setInitialValues({
        interviewId: interviewId || '',
        interviewerId: interviewerId || '',
      });
    }
  }, [searchParams]);

  const feedbackFields: FieldConfig[] = [
    {
      name: "interviewId",
      label: "Interview ID",
      type: "text",
      placeholder: "Enter MongoDB Interview ID",
      required: true,
    },
    {
      name: "interviewerId",
      label: "Interviewer ID",
      type: "text",
      placeholder: "Enter MongoDB Interviewer ID",
      required: true,
    },
    {
      name: "score",
      label: "Score (0-100)",
      type: "number",
      placeholder: "Enter score between 0 and 100",
      required: true,
    },
    {
      name: "comments",
      label: "Comments",
      type: "textarea",
      placeholder: "Enter feedback comments (optional)",
      required: false,
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      console.log('=== RAW FORM DATA ===');
      console.log(data);
      
      // Convert score to number
      if (data.score) {
        data.score = Number(data.score);
      }
      
      // Validate score range
      if (data.score < 0 || data.score > 100) {
        alert('Score must be between 0 and 100');
        return;
      }
      
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
        '/recruitment/feedback',
        cleanedData
      );
      
      alert('Feedback created successfully!');
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
      title="Create Interview Feedback"
    >
      <GenericForm
        fields={feedbackFields}
        onSubmit={handleSubmit}
        submitButtonText="Submit Feedback"
        initialValues={initialValues} 
        key={JSON.stringify(initialValues)} // ✅ Pass initial values
      />
   </FormPageWrapper>
  );
}