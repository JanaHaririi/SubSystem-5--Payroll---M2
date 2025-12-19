"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";


interface HistoryEntry {
  _id: string;
  applicationId: string;
  oldStage?: string;
  newStage?: string;
  oldStatus?: string;
  newStatus?: string;
  changedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ApplicationHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!id) {
        setError("No application ID provided");
        setLoading(false);
        return;
      }

      console.log('Fetching history for application ID:', id);

      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get(`/recruitment/applications/${id}/history`);
        console.log('History response:', response.data);
        setHistory(response.data);
      } catch (err: any) {
        console.error("Error fetching application history:", err);
        console.error("Error response:", err.response);
        setError(err.response?.data?.message || "Failed to load application history");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#7C40A9';
    
    const colors: Record<string, string> = {
      applied: '#9570DD',
      screening: '#7C40A9',
      interviewing: '#b89bf1',
      offered: '#693699',
      rejected: '#2b0848',
      withdrawn: '#4d2f63',
      hired: '#693699'
    };
    return colors[status.toLowerCase()] || '#7C40A9';
  };

  const getStageColor = (stage?: string) => {
    if (!stage) return '#7C40A9';
    
    const colors: Record<string, string> = {
      application: '#9570DD',
      screening: '#7C40A9',
      interview: '#b89bf1',
      offer: '#693699',
      hired: '#693699',
      rejected: '#2b0848'
    };
    return colors[stage.toLowerCase()] || '#7C40A9';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBanner}>
          <p><strong>Error:</strong> {error}</p>
        </div>
        <button
          onClick={() => router.push('/recruitment/hr/applications')}
          className={styles.updateButton}
        >
          Back to Applications
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '32px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => router.back()}
            className={styles.updateButton}
          >
            ← Back
          </button>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>
            Application History
          </h1>
        </div>
        <div className={styles.fullLine}></div>

        {/* Application ID Badge */}
        <div style={{
          backgroundColor: '#4d2f63',
          border: '3px solid #693699',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'inline-block'
        }}>
          <span style={{ color: '#e9d5ff', fontSize: '14px' }}>Application ID: </span>
          <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '700' }}>{id}</span>
        </div>

        {/* Content */}
        {history.length === 0 ? (
          <div className={styles.card} style={{
            padding: '60px 40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '700',
              marginBottom: '8px'
            }}>
              No history records found
            </div>
            <div style={{ 
              fontSize: '14px',
              color: '#e9d5ff'
            }}>
              This application doesn't have any status or stage changes yet
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{
              position: 'absolute',
              left: '31px',
              top: '20px',
              bottom: '20px',
              width: '3px',
              background: 'linear-gradient(180deg, #7C40A9 0%, #693699 100%)'
            }} />

            {/* History entries */}
            {history.map((entry, index) => (
              <div
                key={entry._id}
                className={styles.card}
                style={{
                  position: 'relative',
                  marginBottom: index === history.length - 1 ? 0 : '24px',
                  paddingLeft: '80px'
                }}
              >
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute',
                  left: '24px',
                  top: '32px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#b89bf1',
                  border: '4px solid #e6d9ff',
                  boxShadow: '0 0 0 3px #7C40A9',
                  zIndex: 1
                }} />

                {/* Timestamp */}
                <div style={{
                  fontSize: '13px',
                  color: '#e9d5ff',
                  marginBottom: '16px',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  {formatDate(entry.createdAt)}
                </div>

                {/* Changes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {entry.oldStatus && entry.newStatus && (
                    <div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#e9d5ff', 
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: '700'
                      }}>
                        Status Changed
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span className={styles.statusBadge} style={{
                          backgroundColor: `${getStatusColor(entry.oldStatus)}`,
                          color: '#ffffff',
                          border: `2px solid #693699`
                        }}>
                          {entry.oldStatus}
                        </span>
                        <span style={{ 
                          color: '#e9d5ff', 
                          fontSize: '20px',
                          fontWeight: 'bold'
                        }}>
                          →
                        </span>
                        <span className={styles.statusBadge} style={{
                          backgroundColor: `${getStatusColor(entry.newStatus)}`,
                          color: '#ffffff',
                          border: `2px solid #693699`
                        }}>
                          {entry.newStatus}
                        </span>
                      </div>
                    </div>
                  )}

                  {entry.oldStage && entry.newStage && (
                    <div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#e9d5ff', 
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: '700'
                      }}>
                        Stage Changed
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span className={styles.statusBadge} style={{
                          backgroundColor: `${getStageColor(entry.oldStage)}`,
                          color: '#ffffff',
                          border: `2px solid #693699`
                        }}>
                          {entry.oldStage}
                        </span>
                        <span style={{ 
                          color: '#e9d5ff', 
                          fontSize: '20px',
                          fontWeight: 'bold'
                        }}>
                          →
                        </span>
                        <span className={styles.statusBadge} style={{
                          backgroundColor: `${getStageColor(entry.newStage)}`,
                          color: '#ffffff',
                          border: `2px solid #693699`
                        }}>
                          {entry.newStage}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}