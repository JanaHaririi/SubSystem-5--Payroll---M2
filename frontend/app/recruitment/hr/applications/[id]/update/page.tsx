"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";

import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

export default function UpdateApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await axiosInstance.get(`/recruitment/applications/${id}`);
        const application = response.data;
        
        // Format date to YYYY-MM-DD for date input
        if (application.appliedDate) {
          application.appliedDate = new Date(application.appliedDate).toISOString().split('T')[0];
        }
        
        // Extract ObjectId if candidateId is populated
        if (application.candidateId && typeof application.candidateId === 'object') {
          application.candidateId = application.candidateId._id;
        }
        
        // Extract ObjectId if requisitionId is populated
        if (application.requisitionId && typeof application.requisitionId === 'object') {
          application.requisitionId = application.requisitionId._id;
        }
        
        // Extract ObjectId if assignedHr is populated
        if (application.assignedHr && typeof application.assignedHr === 'object') {
          application.assignedHr = application.assignedHr._id;
        }
        
        setInitialData(application);
      } catch (error) {
        console.error("Error fetching application:", error);
        alert("Failed to load application");
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const applicationFields: FieldConfig[] = [
    {
      name: "candidateId",
      label: "Candidate ID",
      type: "text",
      placeholder: "Enter MongoDB Candidate ID",
      required: true,
    },
    {
      name: "requisitionId",
      label: "Requisition ID",
      type: "text",
      placeholder: "Enter MongoDB Requisition ID",
      required: true,
    },
    {
      name: "status",
      label: "Application Status",
      type: "select",
      required: true,
      options: [
        { value: "applied", label: "Applied" },
        { value: "screening", label: "Screening" },
        { value: "interviewing", label: "Interviewing" },
        { value: "offered", label: "Offered" },
        { value: "rejected", label: "Rejected" },
        { value: "withdrawn", label: "Withdrawn" },
        { value: "hired", label: "Hired" },
      ],
    },
    {
      name: "currentStage",
      label: "Current Stage",
      type: "select",
      required: true,
      options: [
        { value: "application", label: "Application" },
        { value: "screening", label: "Screening" },
        { value: "interview", label: "Interview" },
        { value: "offer", label: "Offer" },
        { value: "hired", label: "Hired" },
        { value: "rejected", label: "Rejected" },
      ],
    },
    {
      name: "assignedHr",
      label: "Assigned HR ID",
      type: "text",
      placeholder: "Enter HR Employee ID (optional)",
      required: false,
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      placeholder: "Enter any notes about the application (optional)",
      required: false,
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      // Convert date to ISO format if provided
      if (data.appliedDate) {
        data.appliedDate = new Date(data.appliedDate).toISOString();
      }
      
      // Ensure status and currentStage are lowercase
      if (data.status) {
        data.status = data.status.toLowerCase();
      }
      if (data.currentStage) {
        data.currentStage = data.currentStage.toLowerCase();
      }
      
      const response = await axiosInstance.patch(
        `/recruitment/applications/${id}`,
        data
      );
      alert('Application updated successfully!');
      console.log('Updated:', response.data);
      router.push('/recruitment/hr/applications'); // Redirect back to applications dashboard
    } catch (error: any) {
      console.error("Error:", error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Loading...</div>;
  }

  if (!initialData) {
    return <div style={{ padding: '40px' }}>Application not found</div>;
  }

  return (
    <FormPageWrapper
      title="Update Application"
    >
      <GenericForm
        fields={applicationFields}
        onSubmit={handleSubmit}
        submitButtonText="Update Application"
        initialValues={initialData}
      />
    </FormPageWrapper>
  );
}