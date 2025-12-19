"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

export default function UpdateInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await axiosInstance.get(`/recruitment/interviews/${id}`);
        const interview = response.data;
        
        // Format panel array to comma-separated string for the form
        if (interview.panel && Array.isArray(interview.panel)) {
          interview.panel = interview.panel.join(', ');
        }
        
        // Format date to YYYY-MM-DD for date input
        if (interview.scheduledDate) {
          interview.scheduledDate = new Date(interview.scheduledDate).toISOString().split('T')[0];
        }
        
        setInitialData(interview);
      } catch (error) {
        console.error("Error fetching interview:", error);
        alert("Failed to load interview");
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id]);

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
      name: "calendarEventId",
      label: "Calendar Event ID",
      type: "text",
      placeholder: "Enter calendar event ID (optional)",
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
      name: "status",
      label: "Interview Status",
      type: "select",
      required: true,
      options: [
        { value: "scheduled", label: "Scheduled" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    {
      name: "feedbackId",
      label: "Feedback ID",
      type: "text",
      placeholder: "Enter feedback/assessment result ID (optional)",
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
      // Convert panel string to array of IDs if provided
      if (data.panel && typeof data.panel === 'string') {
        data.panel = data.panel.split(',').map((id: string) => id.trim()).filter(Boolean);
      }
      
      // Convert date to ISO format if provided
      if (data.scheduledDate) {
        data.scheduledDate = new Date(data.scheduledDate).toISOString();
      }
      
      // Ensure status is lowercase
      if (data.status) {
        data.status = data.status.toLowerCase();
      }
      
      const response = await axiosInstance.patch(
        `/recruitment/interviews/${id}`,
        data
      );
      alert('Interview updated successfully!');
      console.log('Updated:', response.data);
      router.push('/recruitment/hr/interviews'); // Redirect back to interviews dashboard
    } catch (error: any) {
      console.error("Error:", error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Loading...</div>;
  }

  if (!initialData) {
    return <div style={{ padding: '40px' }}>Interview not found</div>;
  }

  return (
     <FormPageWrapper
      title="Update Interview"
    >
      <GenericForm
        fields={interviewFields}
        onSubmit={handleSubmit}
        submitButtonText="Update Interview"
        initialValues={initialData}
      />
    </FormPageWrapper>
  );
}