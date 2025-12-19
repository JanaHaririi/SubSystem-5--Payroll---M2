"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";

export default function UpdateOfferPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const response = await axiosInstance.get(`/recruitment/offers/${id}`);
        const offer = response.data;
        
        // Format benefits array to comma-separated string for the form
        if (offer.benefits && Array.isArray(offer.benefits)) {
          offer.benefits = offer.benefits.join(', ');
        }
        
        // Format deadline to YYYY-MM-DD for date input
        if (offer.deadline) {
          offer.deadline = new Date(offer.deadline).toISOString().split('T')[0];
        }
        
        // Extract IDs if fields are populated objects
        if (offer.applicationId && typeof offer.applicationId === 'object') {
          offer.applicationId = offer.applicationId._id;
        }
        if (offer.candidateId && typeof offer.candidateId === 'object') {
          offer.candidateId = offer.candidateId._id;
        }
        if (offer.hrEmployeeId && typeof offer.hrEmployeeId === 'object') {
          offer.hrEmployeeId = offer.hrEmployeeId._id;
        }
        
        setInitialData(offer);
      } catch (error) {
        console.error("Error fetching offer:", error);
        alert("Failed to load offer");
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id]);

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
      name: "finalStatus",
      label: "Final Status",
      type: "select",
      required: true,
      options: [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "withdrawn", label: "Withdrawn" },
      ],
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      // Convert benefits string to array if provided
      if (data.benefits && typeof data.benefits === 'string') {
        data.benefits = data.benefits.split(',').map((benefit: string) => benefit.trim()).filter(Boolean);
      }
      
      // Convert deadline to ISO format if provided
      if (data.deadline) {
        data.deadline = new Date(data.deadline).toISOString();
      }
      
      // Convert salary fields to numbers
      if (data.grossSalary) {
        data.grossSalary = Number(data.grossSalary);
      }
      if (data.signingBonus) {
        data.signingBonus = Number(data.signingBonus);
      }
      
      // Ensure status fields are lowercase
      if (data.applicantResponse) {
        data.applicantResponse = data.applicantResponse.toLowerCase();
      }
      if (data.finalStatus) {
        data.finalStatus = data.finalStatus.toLowerCase();
      }
      
      const response = await axiosInstance.patch(
        `/recruitment/offers/${id}`,
        data
      );
      
      alert('Offer updated successfully!');
      console.log('Updated:', response.data);
      router.push('/recruitment/hr/offers');
    } catch (error: any) {
      console.error("Error:", error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Loading...</div>;
  }

  if (!initialData) {
    return <div style={{ padding: '40px' }}>Offer not found</div>;
  }

  return (
   < FormPageWrapper
          title=" Update Offer "
          
          icon=""
        >
      <GenericForm
        fields={offerFields}
        onSubmit={handleSubmit}
        submitButtonText="Update Offer"
        initialValues={initialData}
      />
          </FormPageWrapper>

  );
}
