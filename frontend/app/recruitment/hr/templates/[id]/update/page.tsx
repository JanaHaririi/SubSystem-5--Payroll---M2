"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

export default function UpdateTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await axiosInstance.get(`/recruitment/templates/${id}`);
        setInitialData(response.data);
      } catch (error) {
        console.error("Error fetching template:", error);
        alert("Failed to load template");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id]);

  const templateFields: FieldConfig[] = [
    {
      name: "title",
      label: "Job Title",
      type: "text",
      placeholder: "e.g., Senior Software Engineer",
      required: true,
    },
    {
      name: "department",
      label: "Department",
      type: "text",
      placeholder: "e.g., Engineering",
      required: true,
    },
    {
      name: "description",
      label: "Job Description",
      type: "textarea",
      placeholder: "Enter job description",
      required: true,
    },
    {
      name: "qualifications",
      label: "Qualifications",
      type: "textarea",
      placeholder: "List required qualifications",
      required: true,
    },
    {
      name: "skills",
      label: "Required Skills",
      type: "textarea",
      placeholder: "List required skills",
      required: true,
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      const response = await axiosInstance.patch(
        `/recruitment/templates/${id}`,
        data
      );
      alert('Template updated successfully!');
      console.log('Updated:', response.data);
      router.push('/recruitment/hr/dashboard'); // Redirect back to dashboard
    } catch (error: any) {
      console.error("Error:", error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Loading...</div>;
  }

  if (!initialData) {
    return <div style={{ padding: '40px' }}>Template not found</div>;
  }

  return (
    < FormPageWrapper
              title=" Update Template "
              
              icon=""
            >
      <GenericForm
        fields={templateFields}
        onSubmit={handleSubmit}
        submitButtonText="Update Template"
        initialValues={initialData} // Pass initial data to pre-fill the form
      />
    </FormPageWrapper>
  );
}