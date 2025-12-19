"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

function UpdateFeedbackContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await axiosInstance.get(`/recruitment/feedback/${id}`);
        const feedback = response.data;
        
        setInitialData(feedback);
      } catch (error) {
        console.error("Error fetching feedback:", error);
        alert("Failed to load feedback");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [id]);

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
      console.log('=== UPDATE FORM DATA ===');
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
      
      const response = await axiosInstance.patch(
        `/recruitment/feedback/${id}`,
        cleanedData
      );
      
      alert('Feedback updated successfully!');
      console.log('Updated:', response.data);
      router.push('/recruitment/hr/interviews'); // Redirect back to interviews dashboard
    } catch (error: any) {
      console.error('=== ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Loading...</div>;
  }

  if (!initialData) {
    return <div style={{ padding: '40px' }}>Feedback not found</div>;
  }

  return (
    <GenericForm
      fields={feedbackFields}
      onSubmit={handleSubmit}
      submitButtonText="Update Feedback"
      initialValues={initialData}
    />
  );
}

export default function UpdateFeedbackPage() {
  return (
    <FormPageWrapper
      title="Create Job Offer & Contract"
      
>      <Suspense fallback={<div>Loading form...</div>}>
        <UpdateFeedbackContent />
      </Suspense>
    </FormPageWrapper>
  );
}