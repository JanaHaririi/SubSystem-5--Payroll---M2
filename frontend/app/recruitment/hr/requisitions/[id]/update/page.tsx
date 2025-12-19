"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

export default function UpdateRequisitionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequisition = async () => {
      try {
        const response = await axiosInstance.get(`/recruitment/requisitions/${id}`);
        setInitialData(response.data);
      } catch (error) {
        console.error("Error fetching requisition:", error);
        alert("Failed to load requisition");
      } finally {
        setLoading(false);
      }
    };

    fetchRequisition();
  }, [id]);

  const requisitionFields: FieldConfig[] = [
    {
      name: "requisitionId",
      label: "Requisition ID",
      type: "text",
      placeholder: "Enter requisition ID",
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
      const response = await axiosInstance.patch(
        `/recruitment/requisitions/${id}`,
        data
      );
      alert('Requisition updated successfully!');
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
    return <div style={{ padding: '40px' }}>Requisition not found</div>;
  }

  return (
    < FormPageWrapper
              title=" Update Requisition "
              icon=""
            >
      <GenericForm
        fields={requisitionFields}
        onSubmit={handleSubmit}
        submitButtonText="Update Requisition"
        initialValues={initialData} // Pass initial data to pre-fill the form
      />
    </FormPageWrapper>
  );
}