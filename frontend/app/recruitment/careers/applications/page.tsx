"use client";

import { useState } from "react";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import formStyles from '@/app/recruitment/component/generic-form.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import { useRouter } from "next/navigation";

export default function CreateApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Consent state
  const [consents, setConsents] = useState({
    dataProcessing: false,
    backgroundCheck: false,
  });

  // Document upload state
  const [documents, setDocuments] = useState<{ file: File; type: string }[]>([]);

  const applicationFields: FieldConfig[] = [
    {
      name: "candidateId",
      label: "Candidate ID",
      type: "text",
      placeholder: "Enter MongoDB candidate ID",
      required: true,
    },
    {
      name: "requisitionId",
      label: "Job Requisition ID",
      type: "text",
      placeholder: "Enter MongoDB requisition ID",
      required: true,
    },
    {
      name: "ownerId",
      label: "Owner ID",
      type: "text",
      placeholder: "Enter MongoDB owner ID",
      required: true,
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocuments((prev) => [...prev, { file: e.target.files![0], type: "cv" }]);
    }
  };

  const removeFile = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (data: Record<string, any>) => {
    setError(null);

    // Validate consents
    if (!consents.dataProcessing || !consents.backgroundCheck) {
      setError("Please provide all required consents");
      alert("Please provide all required consents");
      return;
    }

    // Validate document upload
    if (documents.length === 0) {
      setError("Please upload at least one document (CV)");
      alert("Please upload at least one document");
      return;
    }

    setLoading(true);

    try {
      // Create the application first
      const applicationResponse = await axiosInstance.post("/recruitment/applications", {
        candidateId: data.candidateId.trim(),
        requisitionId: data.requisitionId.trim(),
      });
      
      const applicationId = applicationResponse.data._id;
      console.log("Application created:", applicationResponse.data);

      // Create document with consents
      const documentData = {
        candidateId: data.candidateId.trim(),
        applicationId: applicationId,
        filePath: "/uploads/resume.pdf",
        type: "cv",
        uploadedAt: new Date(),
        consents: {
          dataProcessing: consents.dataProcessing,
          backgroundCheck: consents.backgroundCheck,
          timestamp: new Date().toISOString(),
        }
      };

      await axiosInstance.post('/onboarding/documents', documentData);

      alert("✅ Application and documents submitted successfully!");
      router.push("/recruitment/candidate/dashboard");
    } catch (err: any) {
      console.error("Error submitting application:", err);
      const errorMsg = err.response?.data?.message || err.message || "Submission failed";
      setError(errorMsg);
      alert("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageWrapper
      title="Create Job Application"
      description="Create a new job application by providing candidate and requisition details. All required fields must be completed, including document upload and consent checkboxes."
      icon="📝"
    >
      {/* Error Display */}
      {error && (
        <div style={{ 
          padding: '16px', 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '2px solid #ef4444', 
          borderRadius: '8px',
          color: '#dc2626',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Main Form Fields */}
      <GenericForm
        fields={applicationFields}
        onSubmit={handleSubmit}
        submitButtonText={loading ? "Submitting..." : "Submit Application"}
        showResetButton={false}
      />

      {/* Document Upload Section */}
      <div className={formStyles.formGroup} style={{ marginTop: '20px' }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          fontSize: '18px',
          fontWeight: '700',
          color: '#ffffff'
        }}>
          Upload Documents
        </h3>
        
        <label className={formStyles.label} style={{ color: '#ffffff' }}>
          CV/Resume <span className={formStyles.required}>*</span>
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className={formStyles.input}
          style={{ cursor: 'pointer' }}
        />

        {documents.length > 0 && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '2px solid #e9d5ff'
          }}>
            <h4 style={{ 
              margin: '0 0 10px 0', 
              fontSize: '16px',
              fontWeight: '600',
              color: '#693699'
            }}>
              Selected Documents:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {documents.map((doc, i) => (
                <li key={i} style={{ 
                  marginBottom: '8px',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  <strong>{doc.type.toUpperCase()}:</strong> {doc.file.name}{" "}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    style={{
                      marginLeft: '10px',
                      padding: '4px 12px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Consent Section */}
      <div className={formStyles.formGroup} style={{ marginTop: '20px' }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          fontSize: '18px', 
          fontWeight: '700',
          color: '#ffffff'
        }}>
          Consent & Authorization
        </h3>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'start', 
            gap: '10px', 
            cursor: 'pointer',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <input
              type="checkbox"
              checked={consents.dataProcessing}
              onChange={(e) => setConsents({ ...consents, dataProcessing: e.target.checked })}
              required
              style={{ 
                marginTop: '4px', 
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#9570DD',
                flexShrink: 0
              }}
            />
            <span style={{ 
              fontSize: '14px', 
              lineHeight: '1.5',
              color: '#ffffff',
              fontWeight: '500'
            }}>
              I consent to the processing of my personal data for recruitment purposes in accordance with applicable privacy laws. <span style={{ color: '#fca5a5' }}>*</span>
            </span>
          </label>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'start', 
            gap: '10px', 
            cursor: 'pointer',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <input
              type="checkbox"
              checked={consents.backgroundCheck}
              onChange={(e) => setConsents({ ...consents, backgroundCheck: e.target.checked })}
              required
              style={{ 
                marginTop: '4px', 
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#9570DD',
                flexShrink: 0
              }}
            />
            <span style={{ 
              fontSize: '14px', 
              lineHeight: '1.5',
              color: '#ffffff',
              fontWeight: '500'
            }}>
              I authorize the company to conduct background checks as part of the hiring process. <span style={{ color: '#fca5a5' }}>*</span>
            </span>
          </label>
        </div>

        <p style={{ 
          fontSize: '12px', 
          color: '#e9d5ff', 
          marginTop: '12px',
          marginBottom: 0,
          fontStyle: 'italic'
        }}>
          * Required fields - Both consents must be checked to submit
        </p>
      </div>

      {/* Back Button */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#9570DD',
            color: '#ffffff',
            border: '2px solid #9570DD',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#7C40A9';
            e.currentTarget.style.borderColor = '#7C40A9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#9570DD';
            e.currentTarget.style.borderColor = '#9570DD';
          }}
        >
          ← Back to Applications
        </button>
      </div>
    </FormPageWrapper>
  );
}