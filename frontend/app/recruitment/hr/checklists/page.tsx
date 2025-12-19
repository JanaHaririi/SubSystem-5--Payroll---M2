// app/offboarding/checklists/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";

type ChecklistItem = {
  department: string;
  status?: "pending" | "approved" | "rejected";
  comments?: string;
  updatedBy?: string;
  updatedAt?: string;
};

type EquipmentItem = {
  equipmentId?: string;
  name: string;
  returned?: boolean;
  condition?: string;
};

type ClearanceChecklist = {
  _id: string;
  terminationId: string;
  items?: ChecklistItem[];
  equipmentList?: EquipmentItem[];
  cardReturned?: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ChecklistsPage() {
  const router = useRouter();
  const [checklists, setChecklists] = useState<ClearanceChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/offboarding/checklists");
      setChecklists(response.data || []);
    } catch (err: any) {
      console.error("Failed to load checklists:", err);
      setError(err.response?.data?.message || "Failed to load checklists");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return { bg: "#10b981", text: "#ffffff" };
      case "rejected":
        return { bg: "#ef4444", text: "#ffffff" };
      case "pending":
      default:
        return { bg: "#f59e0b", text: "#ffffff" };
    }
  };

  const getOverallStatus = (checklist: ClearanceChecklist) => {
    if (!checklist.items || checklist.items.length === 0) return "pending";
    
    const allApproved = checklist.items.every(item => item.status === "approved");
    const anyRejected = checklist.items.some(item => item.status === "rejected");
    
    if (allApproved && checklist.cardReturned) return "approved";
    if (anyRejected) return "rejected";
    return "pending";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className={styles.loading}>Loading checklists...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Clearance Checklists</h1>
        <button
          onClick={() => router.push("/recruitment/hr/checklists/create")}
          className={styles.createButton}
        >
          Create New Checklist
        </button>
      </div>

      <div className={styles.fullLine}></div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBanner}>
          {error}
        </div>
      )}

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div className={styles.card}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 }}>Total Checklists</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700' }}>{checklists.length}</p>
        </div>

        <div className={styles.card}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 }}>Pending</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
            {checklists.filter(c => getOverallStatus(c) === "pending").length}
          </p>
        </div>

        <div className={styles.card}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 }}>Completed</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
            {checklists.filter(c => getOverallStatus(c) === "approved").length}
          </p>
        </div>

        <div className={styles.card}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 }}>Rejected</p>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
            {checklists.filter(c => getOverallStatus(c) === "rejected").length}
          </p>
        </div>
      </div>

      {/* Checklists List */}
      {checklists.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#7C40A9',
          borderRadius: '12px',
          border: '2px solid #9570DD'
        }}>
          <h3 style={{ color: '#ffffff', marginBottom: '10px', fontSize: '20px' }}>No checklists found</h3>
          <p style={{ color: '#ffffff', marginBottom: '20px', opacity: 0.9 }}>
            Get started by creating your first clearance checklist
          </p>
          <button
            onClick={() => router.push("/recruitment/offboarding/checklists/create")}
            className={styles.createButton}
          >
            Create Checklist
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {checklists.map((checklist) => {
            const overallStatus = getOverallStatus(checklist);
            const items = checklist.items || [];
            const equipment = checklist.equipmentList || [];
            const completedItems = items.filter(i => i.status === "approved").length;
            const totalItems = items.length;
            const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
            const isExpanded = expandedId === checklist._id;
            const statusColors = getStatusColor(overallStatus);

            return (
              <div key={checklist._id} className={styles.card}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '20px',
                  paddingBottom: '15px',
                  borderBottom: '1px solid rgba(255,255,255,0.2)',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1, minWidth: '250px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '22px', fontWeight: '700' }}>
                      Checklist #{checklist._id.slice(-8)}
                    </h3>
                    <div style={{ display: 'grid', gap: '6px', fontSize: '14px', opacity: 0.9 }}>
                      <p style={{ margin: 0 }}>
                        <strong>Termination ID:</strong> {checklist.terminationId}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Created:</strong> {formatDate(checklist.createdAt)}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Last Updated:</strong> {formatDate(checklist.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                    <div style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: statusColors.bg,
                      color: statusColors.text,
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
                    </div>

                    <div className={styles.actions}>
                      <button
                        onClick={() => toggleExpand(checklist._id)}
                        className={styles.button}
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </button>

                      <button
                        onClick={() => router.push(`/recruitment/hr/checklists/${checklist._id}/update`)}
                        className={styles.updateBtn}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                    <span style={{ fontWeight: '600' }}>Overall Progress</span>
                    <span style={{ opacity: 0.9 }}>
                      {completedItems} / {totalItems} departments ({completionPercentage}%)
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '10px',
                    backgroundColor: '#9570DD',
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${completionPercentage}%`,
                      height: '100%',
                      backgroundColor: completionPercentage === 100 ? '#10b981' : '#3b82f6',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Quick Summary */}
                {!isExpanded && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px'
                  }}>
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#9570DD',
                      borderRadius: '8px',
                      border: '2px solid #693699'
                    }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.8 }}>Departments</p>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{items.length}</p>
                    </div>

                    <div style={{
                      padding: '12px',
                      backgroundColor: '#9570DD',
                      borderRadius: '8px',
                      border: '2px solid #693699'
                    }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.8 }}>Equipment Items</p>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{equipment.length}</p>
                    </div>

                    <div style={{
                      padding: '12px',
                      backgroundColor: '#9570DD',
                      borderRadius: '8px',
                      border: '2px solid #693699'
                    }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.8 }}>Access Card</p>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: checklist.cardReturned ? '#10b981' : '#f59e0b' }}>
                        {checklist.cardReturned ? 'Returned' : 'Pending'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ display: 'grid', gap: '20px' }}>
                    
                    {/* Department Clearances */}
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
                        Department Clearances ({items.length})
                      </h4>
                      
                      {items.length === 0 ? (
                        <div style={{
                          padding: '30px',
                          backgroundColor: '#9570DD',
                          borderRadius: '8px',
                          textAlign: 'center',
                          opacity: 0.7
                        }}>
                          No department clearances added
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {items.map((item, index) => {
                            const itemColors = getStatusColor(item.status);
                            return (
                              <div
                                key={index}
                                style={{
                                  padding: '16px',
                                  backgroundColor: '#9570DD',
                                  borderRadius: '8px',
                                  border: `2px solid ${itemColors.bg}`
                                }}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '12px',
                                  flexWrap: 'wrap',
                                  gap: '8px'
                                }}>
                                  <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                                    {item.department}
                                  </h5>
                                  <div style={{
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: itemColors.bg,
                                    color: itemColors.text,
                                    fontSize: '12px',
                                    fontWeight: '600'
                                  }}>
                                    {item.status || 'pending'}
                                  </div>
                                </div>

                                {item.comments && (
                                  <div style={{
                                    padding: '12px',
                                    backgroundColor: '#693699',
                                    borderRadius: '6px',
                                    marginBottom: '12px'
                                  }}>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.8 }}>Comments:</p>
                                    <p style={{ margin: 0, fontSize: '14px' }}>{item.comments}</p>
                                  </div>
                                )}

                                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', flexWrap: 'wrap' }}>
                                  {item.updatedBy && (
                                    <div><strong>Updated by:</strong> {item.updatedBy}</div>
                                  )}
                                  {item.updatedAt && (
                                    <div><strong>Updated:</strong> {formatDate(item.updatedAt)}</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Equipment List */}
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
                        Equipment to Return ({equipment.length})
                      </h4>
                      
                      {equipment.length === 0 ? (
                        <div style={{
                          padding: '30px',
                          backgroundColor: '#9570DD',
                          borderRadius: '8px',
                          textAlign: 'center',
                          opacity: 0.7
                        }}>
                          No equipment items added
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                          {equipment.map((eq, index) => (
                            <div
                              key={index}
                              style={{
                                padding: '16px',
                                backgroundColor: '#9570DD',
                                borderRadius: '8px',
                                border: eq.returned ? '2px solid #10b981' : '2px solid #ef4444'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px'
                              }}>
                                <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{eq.name}</h5>
                                <div style={{
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  backgroundColor: eq.returned ? '#10b981' : '#ef4444',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}>
                                  {eq.returned ? 'Returned' : 'Not Returned'}
                                </div>
                              </div>

                              <div style={{ display: 'grid', gap: '4px', fontSize: '13px' }}>
                                {eq.equipmentId && (
                                  <div><strong>ID:</strong> {eq.equipmentId}</div>
                                )}
                                {eq.condition && (
                                  <div><strong>Condition:</strong> {eq.condition}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Access Card Status */}
                    <div style={{
                      padding: '16px',
                      backgroundColor: checklist.cardReturned ? '#10b981' : '#f59e0b',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div>
                        <h5 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>
                          Access Card {checklist.cardReturned ? 'Returned' : 'Not Returned'}
                        </h5>
                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                          {checklist.cardReturned 
                            ? 'Employee has returned their access card'
                            : 'Waiting for employee to return access card'
                          }
                        </p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

     
    
    </div>
  );
}