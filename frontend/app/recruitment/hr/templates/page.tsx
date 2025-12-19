"use client";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";
export default function CreateTemplatePage() {
  
  const userFields: FieldConfig[] = [
    {
      name: "title",
      label: "Job Title",
      type: "text",
      required: true,
    },
    {
      name: "department",
      label: "Department",
      type: "text",
      required: true,
    },
    {
      name: "qualifications",
      label: "Qualifications",
      type: "text",
      required: true,
    },
    {
      name: "skills",
      label: "Required Skills",
      type: "text",
      multiple: true,
    },
    {
      name: "description",
      label: "Job Description",
      type: "textarea",
      placeholder: "Describe the role and responsibilities...",
      required: true,
    },
  ];


  const handleSubmit = async (data: Record<string, any>) => {
    try{

      const response = await axiosInstance.post('/recruitment/templates/' , data);
      alert('Template created successfully!');
    console.log('Created:', response);
  } catch (error: any) {
    alert('Error: ' + error.message);
  }
    }
   

  return (
  <FormPageWrapper
      title="Create Template"
      icon=""
    >
      <GenericForm
        fields={userFields}
        onSubmit={handleSubmit}
        submitButtonText="Create Template"
      />
    </FormPageWrapper>
  );
} 
