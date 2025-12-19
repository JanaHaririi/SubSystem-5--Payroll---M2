"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";
import axiosInstance from "@/app/utils/ApiClient";

export default function CreateChecklistPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define form fields
  const fields: FieldConfig[] = [
    {
      name: "employeeId",
      label: "Employee ID",
      type: "text",
      placeholder: "Enter employee ID (e.g., 507f1f77bcf86cd799439011)",
      required: true,
    },
       {
      name: "contractId",
      label: "contract ID",
      type: "text",
      placeholder: "Enter contract ID (e.g., 507f1f77bcf86cd799439011)",
      required: true,
    },
    {
      name: "taskName1",
      label: "Task 1 - Name",
      type: "text",
      placeholder: "e.g., Complete onboarding paperwork",
      required: true,
    },
    {
      name: "taskDepartment1",
      label: "Task 1 - Department",
      type: "text",
      placeholder: "e.g., HR",
      required: true,
    },
    {
      name: "taskDeadline1",
      label: "Task 1 - Deadline (Optional)",
      type: "date",
      required: false,
    },
    {
      name: "taskStatus1",
      label: "Task 1 - Status",
      type: "select",
      required: true,
      options: [
         { value: "pending", label: "Pending" },           // ← lowercase
    { value: "in_progress", label: "In Progress" },   // ← lowercase with underscore
    { value: "completed", label: "Completed" }, 
      ],
    },
    {
      name: "taskName2",
      label: "Task 2 - Name (Optional)",
      type: "text",
      placeholder: "e.g., Set up workstation",
      required: false,
    },
    {
      name: "taskDepartment2",
      label: "Task 2 - Department (Optional)",
      type: "text",
      placeholder: "e.g., IT",
      required: false,
    },
    {
      name: "taskDeadline2",
      label: "Task 2 - Deadline (Optional)",
      type: "date",
      required: false,
    },
    {
      name: "taskStatus2",
      label: "Task 2 - Status (Optional)",
      type: "select",
      required: false,
      options: [
       { value: "pending", label: "Pending" },           // ← lowercase
    { value: "in_progress", label: "In Progress" },   // ← lowercase with underscore
    { value: "completed", label: "Completed" }, 
      ],
    },
    {
      name: "taskName3",
      label: "Task 3 - Name (Optional)",
      type: "text",
      placeholder: "e.g., Attend orientation session",
      required: false,
    },
    {
      name: "taskDepartment3",
      label: "Task 3 - Department (Optional)",
      type: "text",
      placeholder: "e.g., HR",
      required: false,
    },
    {
      name: "taskDeadline3",
      label: "Task 3 - Deadline (Optional)",
      type: "date",
      required: false,
    },
    {
      name: "taskStatus3",
      label: "Task 3 - Status (Optional)",
      type: "select",
      required: false,
      options: [
         { value: "pending", label: "Pending" },           // ← lowercase
    { value: "in_progress", label: "In Progress" },   // ← lowercase with underscore
    { value: "completed", label: "Completed" }, 
      ],
    },
  ];

 const handleSubmit = async (formData: Record<string, any>) => {
  setIsSubmitting(true);

  try {
    // Build tasks array from form data
    const tasks = [];

    // Task 1 (required)
    tasks.push({
      name: formData.taskName1,
      department: formData.taskDepartment1,
      deadline: formData.taskDeadline1 || undefined,
      status: formData.taskStatus1 || 'pending', // ← Ensure default value
    });

    // Task 2 (optional)
    if (formData.taskName2 && formData.taskDepartment2) {
      tasks.push({
        name: formData.taskName2,
        department: formData.taskDepartment2,
        deadline: formData.taskDeadline2 || undefined,
        status: formData.taskStatus2 || 'pending', // ← Ensure default value
      });
    }

    // Task 3 (optional)
    if (formData.taskName3 && formData.taskDepartment3) {
      tasks.push({
        name: formData.taskName3,
        department: formData.taskDepartment3,
        deadline: formData.taskDeadline3 || undefined,
        status: formData.taskStatus3 || 'pending', // ← Ensure default value
      });
    }

    // Create checklist payload
    const checklistData = {
      employeeId: formData.employeeId,
      contractId: formData.contractId, // ← ADD THIS LINE
      tasks: tasks,
    };

    console.log("📤 Creating checklist:", checklistData);

    // Submit to API
    const response = await axiosInstance.post("/onboarding/tasks", checklistData);

    console.log("✅ Checklist created:", response.data);
    alert("Checklist created successfully!");

    // Redirect to dashboard
    router.push("/recruitment/hr/onboardingChecklist");
  } catch (err: any) {
    console.error("❌ Error creating checklist:", err);
    const errorMsg = err.response?.data?.message || err.message || "Failed to create checklist";
    alert(`Error: ${errorMsg}`);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <FormPageWrapper
      title="Create Onboarding Checklist"
      description="Create a new onboarding checklist with tasks for an employee. At least one task is required."
      icon="📋"
    >
      <GenericForm
        fields={fields}
        onSubmit={handleSubmit}
        submitButtonText={isSubmitting ? "Creating..." : "Create Checklist"}
        showResetButton={true}
      />

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => router.push("/recruitment/hr/onboardingChecklist")}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6b7280',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          Cancel
        </button>
      </div>
    </FormPageWrapper>
  );
}