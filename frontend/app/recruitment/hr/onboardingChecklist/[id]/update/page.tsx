"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";
import axiosInstance from "@/app/utils/ApiClient";

export default function UpdateChecklistPage() {
  const router = useRouter();
  const params = useParams();
  const checklistId = params?.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  const [existingChecklist, setExistingChecklist] = useState<any>(null);

  // Load existing checklist data
  useEffect(() => {
    async function loadChecklist() {
      if (!checklistId) {
        alert("No checklist ID provided");
        router.push("/recruitment/hr/onboardingChecklist");
        return;
      }

      try {
        const response = await axiosInstance.get(`/onboarding/tasks/${checklistId}`);
        const checklist = response.data;
        
        console.log("📋 Loaded checklist:", checklist);
        setExistingChecklist(checklist);

        // Map checklist data to form initial values
        const values: Record<string, any> = {
          contractId: checklist.contractId || "",
          employeeId: checklist.employeeId || "",
        };

        // Map tasks to form fields
        checklist.tasks.forEach((task: any, index: number) => {
          const taskNum = index + 1;
          values[`taskName${taskNum}`] = task.name || "";
          values[`taskDepartment${taskNum}`] = task.department || "";
          values[`taskDeadline${taskNum}`] = task.deadline 
            ? new Date(task.deadline).toISOString().split('T')[0] 
            : "";
          values[`taskStatus${taskNum}`] = task.status || "pending";
        });

        setInitialValues(values);
      } catch (err: any) {
        console.error("❌ Error loading checklist:", err);
        alert(`Error: ${err.response?.data?.message || "Failed to load checklist"}`);
        router.push("/recruitment/hr/onboardingChecklist");
      } finally {
        setLoading(false);
      }
    }

    loadChecklist();
  }, [checklistId, router]);

  // Define form fields
  const fields: FieldConfig[] = [
    {
      name: "contractId",
      label: "Contract ID",
      type: "text",
      placeholder: "Enter contract ID",
      required: true,
    },
    {
      name: "employeeId",
      label: "Employee ID",
      type: "text",
      placeholder: "Enter employee ID",
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
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
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
        { value: "", label: "Select Status" },
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
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
        { value: "", label: "Select Status" },
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
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
        status: formData.taskStatus1,
        completedAt: formData.taskStatus1 === 'completed' ? new Date().toISOString() : undefined,
      });

      // Task 2 (optional)
      if (formData.taskName2 && formData.taskDepartment2) {
        tasks.push({
          name: formData.taskName2,
          department: formData.taskDepartment2,
          deadline: formData.taskDeadline2 || undefined,
          status: formData.taskStatus2 || 'pending',
          completedAt: formData.taskStatus2 === 'completed' ? new Date().toISOString() : undefined,
        });
      }

      // Task 3 (optional)
      if (formData.taskName3 && formData.taskDepartment3) {
        tasks.push({
          name: formData.taskName3,
          department: formData.taskDepartment3,
          deadline: formData.taskDeadline3 || undefined,
          status: formData.taskStatus3 || 'pending',
          completedAt: formData.taskStatus3 === 'completed' ? new Date().toISOString() : undefined,
        });
      }

      // Create update payload
      const updateData = {
        contractId: formData.contractId,
        employeeId: formData.employeeId,
        tasks: tasks,
      };

      console.log("📤 Updating checklist:", updateData);

      // Submit to API
      const response = await axiosInstance.patch(`/onboarding/tasks/${checklistId}`, updateData);

      console.log("✅ Checklist updated:", response.data);
      alert("Checklist updated successfully!");

      // Redirect to dashboard
      router.push("/recruitment/hr/onboardingChecklist");
    } catch (err: any) {
      console.error("❌ Error updating checklist:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to update checklist";
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <FormPageWrapper
        title="Update Onboarding Checklist"
        icon="✏️"
      >
        <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff' }}>
          <p>Loading checklist data...</p>
        </div>
      </FormPageWrapper>
    );
  }

  return (
    <FormPageWrapper
      title="Update Onboarding Checklist"
      description={`Update the onboarding checklist for employee: ${existingChecklist?.employeeId || 'Unknown'}`}
      icon="✏️"
    >
      <GenericForm
        fields={fields}
        onSubmit={handleSubmit}
        submitButtonText={isSubmitting ? "Updating..." : "Update Checklist"}
        showResetButton={true}
        initialValues={initialValues}
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