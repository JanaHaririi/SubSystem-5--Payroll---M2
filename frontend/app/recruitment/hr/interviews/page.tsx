"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";
import ConfirmDialog from "@/app/recruitment/component/ConfirmDialog";
import SearchFormInterview from "./SearchFormInterview";

export default function InterviewDashboardPage() {
  const [searchResult, setSearchResult] = useState<{
    type: 'interview';
    data: any;
  } | null>(null);

  const [searchError, setSearchError] = useState<string | null>(null);
  const searchResultRef = useRef<HTMLDivElement>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, any[]>>({});

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: '',
    title: '',
    type: 'interview' as 'interview'
  });

  // Determine what to display based on search - MOVED UP BEFORE USE
  const displayInterviews = searchResult?.data
    ? [searchResult.data] 
    : interviews;
 
  //load all interviews
  useEffect(() => {
    async function loadAll() {
      try {
        const response = await axiosInstance.get("/recruitment/interviews");
        setInterviews(response.data);
      } catch (err) {
        console.error("Error loading interviews:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  // Load feedback for all interviews
  useEffect(() => {
    async function loadFeedback() {
      try {
        const feedbackPromises = displayInterviews.map(async (interview) => {
          try {
            const response = await axiosInstance.get(
              `/recruitment/feedback/by-interview/${interview._id}`
            );
            return { interviewId: interview._id, feedback: response.data };
          } catch (err) {
            return { interviewId: interview._id, feedback: [] };
          }
        });
        
        const results = await Promise.all(feedbackPromises);
        const map = results.reduce((acc, { interviewId, feedback }) => {
          acc[interviewId] = feedback;
          return acc;
        }, {} as Record<string, any[]>);
        
        setFeedbackMap(map);
      } catch (err) {
        console.error("Error loading feedback:", err);
      }
    }

    if (displayInterviews.length > 0) {
      loadFeedback();
    }
  }, [displayInterviews]);

  //smooth searching
  useEffect(() => {
    if (searchResult && searchResultRef.current) {
      setTimeout(() => {
        searchResultRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [searchResult]);

  //delete
  const handleDeleteClick = (id: string, title: string) => {
    setConfirmDialog({ isOpen: true, id, title, type: 'interview' });
  };

  const handleConfirmDelete = async () => {
    try {
      await axiosInstance.delete(`/recruitment/interviews/${confirmDialog.id}`);
      setInterviews(interviews.filter(i => i._id !== confirmDialog.id));
      alert('Deleted successfully!');
      
      if (searchResult?.data?._id === confirmDialog.id) {
        clearSearch();
      }
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setConfirmDialog({ isOpen: false, id: '', title: '', type: 'interview' });
    }
  };

  //search
  const handleSearch = async (id: string, type: 'interview') => {
    setSearchError(null);
    setSearchResult(null);
    setLoading(true);

    try {
      const response = await axiosInstance.get(`/recruitment/interviews/${id}`);
      const data = response.data;
      console.log('Search result:', data);
      
      if (!data || !data._id) {
        throw new Error('Invalid data received');
      }
      
      setSearchResult({ type, data });
    } catch (err: any) {
      console.error("Search error:", err);
      setSearchError(`Interview not found with ID: ${id}`);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResult(null);
    setSearchError(null);
  };

  if (loading && !searchResult) return <div className={styles.loading}>Loading...</div>;
 
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Interviews Dashboard</h1>
      <div className={styles.fullLine}></div>

      {/* Search Form */}
      <SearchFormInterview onSearch={handleSearch} />

      {/* Search Results Info */}
      {searchResult && searchResult.data && (
        <div className={styles.searchInfo}>
          <p>
            Showing search result for interview: <strong>{searchResult.data._id}</strong>
          </p>
          <button onClick={clearSearch} className={styles.clearButton}>
            ✕ Clear Search
          </button>
        </div>
      )}

      {/* Search Error */}
      {searchError && (
        <div className={styles.errorBanner}>
          <p>{searchError}</p>
          <button onClick={clearSearch} className={styles.clearButton}>
            ✕ Dismiss
          </button>
        </div>
      )}
     
      {/* Show Interviews */}
      <>
        <h2 className={styles.pageTitle}>Interviews</h2>

        {loading && <p className={styles.loading}>Loading...</p>}

        {!loading && displayInterviews.length === 0 && (
          <p>No interviews found.</p>
        )}

        {displayInterviews.map((interview) => (
          <div
            key={interview._id}
            className={`${styles.card} ${searchResult?.data?._id === interview._id ? styles.highlight : ''}`}
            ref={searchResult?.data?._id === interview._id ? searchResultRef : null}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "20px",
            }}
          >
            {/* Left side - Interview details */}
            <div>
              <p><strong>ID:</strong> {interview._id}</p>
              <p><strong>Application ID:</strong> {interview.applicationId}</p>
              <p><strong>Stage:</strong> {interview.stage}</p>
              <p><strong>Scheduled Date:</strong> {interview.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Method:</strong> {interview.method || 'N/A'}</p>
              <p><strong>Status:</strong> {interview.status}</p>
              <p><strong>Panel Members:</strong> {interview.panel?.length > 0 ? interview.panel.join(', ') : 'N/A'}</p>
              <p><strong>Video Link:</strong> {interview.videoLink || 'N/A'}</p>
              <p><strong>Calendar Event ID:</strong> {interview.calendarEventId || 'N/A'}</p>
              <p><strong>Feedback ID:</strong> {interview.feedbackId || 'N/A'}</p>
              <p><strong>Candidate Feedback:</strong> {interview.candidateFeedback || 'N/A'}</p>
              
              <div className={styles.actions}>
                <Link
                  href={`/recruitment/hr/interviews/${interview._id}/update`}
                  className={styles.updateBtn}
                >
                  Update Interview
                </Link>

                <Link
                  href={`/recruitment/hr/feedback?interviewId=${interview._id}&interviewerId=${interview.panel?.[0] || ''}`}
                  className={styles.updateBtn}
                >
                  Add Feedback
                </Link>
              </div>
            </div>

            {/* Right side - Feedback box */}
            <div style={{
              border: "2px solid #9570DD",
              borderRadius: "12px",
              padding: "15px",
              backgroundColor: "#7C40A9",
              boxShadow: "0 2px 4px rgba(124, 64, 169, 0.2)"
            }}>
              <h3 style={{ 
                margin: "0 0 15px 0", 
                fontSize: "18px",
                color: "#ffffff",
                fontWeight: "700",
                borderBottom: "2px solid #ffffff",
                paddingBottom: "8px"
              }}>
                Feedback
              </h3>
              {feedbackMap[interview._id]?.length > 0 ? (
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {feedbackMap[interview._id].map((fb: any) => (
                    <div key={fb._id} style={{
                      padding: "12px",
                      marginBottom: "12px",
                      backgroundColor: "#9570DD",
                      borderRadius: "6px",
                      border: "2px solid #693699",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                    }}>
                      <p style={{ 
                        margin: "0 0 8px 0",
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#ffffff"
                      }}>
                        <strong>Score:</strong> {fb.score}/100
                      </p>
                      <p style={{ 
                        margin: "0 0 8px 0",
                        fontSize: "14px",
                        color: "#ffffff"
                      }}>
                        <strong>Interviewer:</strong> {fb.interviewerId}
                      </p>
                      {fb.comments && (
                        <p style={{ 
                          margin: "0 0 8px 0",
                          fontSize: "14px",
                          color: "#ffffff",
                          fontStyle: "italic",
                          paddingTop: "8px",
                          borderTop: "1px solid #ffffff"
                        }}>
                          <strong>Comments:</strong> {fb.comments}
                        </p>
                      )}
                      {/* Edit button */}
                      <Link
                        href={`/recruitment/hr/feedback/${fb._id}/update`}
                        className={styles.updateBtn}
                        style={{
                          display: "inline-block",
                          marginTop: "8px",
                        }}
                      >
                        Edit Feedback
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ 
                  color: "#ffffff", 
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: "20px 0",
                  fontSize: "14px"
                }}>
                  No feedback yet
                </p>
              )}
            </div>
          </div>
        ))}
      </>

      {/* Action links */}
      <div className={styles.actions} style={{ marginTop: '30px' }}>
        <Link href="/recruitment/hr/interviews/create" className={styles.button}>
          Create Interview
        </Link>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, id: '', title: '', type: 'interview' })}
      />
    </div>
  );
}