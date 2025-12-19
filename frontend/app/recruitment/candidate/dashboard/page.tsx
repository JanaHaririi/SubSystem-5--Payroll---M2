"use client";
import Link from "next/link";
import axiosInstance from "@/app/utils/ApiClient";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/(system)/context/authContext";

export default function CandidateDashboard() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [candidateId, setCandidateId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Offer response states
  const [offerResponses, setOfferResponses] = useState<Record<string, string>>({});
  const {user} = useAuth()

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      // Get current user info from /auth/me endpoint
      // The token is automatically sent via HTTP-only cookie
      console.log("🔍 Fetching user info from /auth/me...");
      const userResponse = await axiosInstance.get("/auth/me");
      console.log("✅ /auth/me response:", userResponse.data);
      
      const userData = userResponse.data;
      
      // Try multiple possible ID fields
      const userId = userData.userid  // ← Your API uses lowercase 'userid'
                  || userData._id 
                  || userData.userId 
                  || userData.id
                  || userData.user?._id
                  || userData.user?.userId
                  || userData.user?.id;
      
      console.log("📋 Extracted user ID:", userId);
      console.log("📋 Full user data structure:", JSON.stringify(userData, null, 2));
      
      if (!userId) {
        console.error("❌ No user ID in response!");
        console.error("Available fields:", Object.keys(userData));
        // Don't redirect immediately - let's see what we got
        setLoading(false);
        return;
      }

      setCandidateId(userId);
      setCandidateInfo(userData);

      // Load all candidate data
      await Promise.all([
        loadApplications(userId),
        loadOffers(userId),
        loadTasks(userId),
        loadDocuments(userId),
        loadNotifications(userId),
      ]);

    } catch (err: any) {
      console.error("❌ Error loading dashboard:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log("🔄 Redirecting to login...");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }
  
  // Load contracts after offers
  useEffect(() => {
    if (offers.length > 0 && candidateId) {
      loadContracts(candidateId);
    }
  }, [offers, candidateId]);

  // Load interviews after applications
  useEffect(() => {
    if (applications.length > 0 && candidateId) {
      loadInterviews();
    }
  }, [applications, candidateId]);

  const loadApplications = async (userId: string) => {
    try {
      const response = await axiosInstance.get(`/recruitment/applications/candidate/${userId}`);
      setApplications(response.data);
    } catch (err) {
      console.error("Error loading applications:", err);
    }
  };

  const loadOffers = async (userId: string) => {
    try {
      const response = await axiosInstance.get(`/recruitment/offers/candidate/${userId}`);
      setOffers(response.data);
    } catch (err) {
      console.error("Error loading offers:", err);
    }
  };

  const loadContracts = async (userId: string) => {
    try {
      const contractPromises = offers.map(async (offer) => {
        try {
          const contractResponse = await axiosInstance.get(`/onboarding/contracts/by-offer/${offer._id}`);
          return contractResponse.data;
        } catch (err: any) {
          return null;
        }
      });

      const contractResults = await Promise.all(contractPromises);
      const validContracts = contractResults.filter(c => c !== null);
      setContracts(validContracts);
    } catch (err) {
      console.error("Error loading contracts:", err);
    }
  };

  const loadInterviews = async () => {
    try {
      const interviewPromises = applications.map(async (application) => {
        try {
          const interviewResponse = await axiosInstance.get(`/recruitment/interviews/applications/${application._id}`);
          return interviewResponse.data;
        } catch (err: any) {
          return null;
        }
      });

      const interviewResults = await Promise.all(interviewPromises);
      const validInterviews = interviewResults.filter(i => i !== null);
      setInterviews(validInterviews);
    } catch (err) {
      console.error("Error loading interviews:", err);
    }
  };

  const loadTasks = async (userId: string) => {
    try {
      const allTasks = await axiosInstance.get(`/onboarding/tasks/employee/${userId}`);
      setTasks(allTasks.data);
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
  };

  const loadDocuments = async (userId: string) => {
    try {
      const response = await axiosInstance.get(`/onboarding/documents/${userId}`);
      setDocuments(response.data);
    } catch (err: any) {
      console.error('❌ Error loading documents:', err);
      setDocuments([]);
    }
  };

  const loadNotifications = async (userId: string) => {
    try {
      const response = await axiosInstance.get(`/time-management/notification-log/employee/${userId}`);
      const notifData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
        console.log(response.data.data)
      setNotifications(notifData);
    } catch (err: any) {
      console.error('❌ Error loading notifications:', err);
      setNotifications([]);
    }
  };

  const handleOfferResponse = async (offerId: string) => {
    const response = offerResponses[offerId];
    if (!response) {
      alert("Please select Accept or Reject");
      return;
    }

    try {
      await axiosInstance.patch(`/recruitment/offers/${offerId}`, {
        applicantResponse: response,
        candidateSignedAt: new Date().toISOString(),
      });
      
      alert(`Offer ${response} successfully!`);
      loadOffers(candidateId);
    } catch (err) {
      console.error("Error updating offer:", err);
      alert("Failed to update offer response");
    }
  };

  const handleTaskToggle = async (taskId: string, taskIndex: number, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    
    try {
      await axiosInstance.patch(`/onboarding/tasks/${taskId}`, {
        [`tasks.${taskIndex}.status`]: newStatus,
        [`tasks.${taskIndex}.completedAt`]: newStatus === 'COMPLETED' ? new Date().toISOString() : null,
      });
      
      alert(`Task marked as ${newStatus}!`);
      loadTasks(candidateId);
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task");
    }
  };

   const handleContractSign = async (contractId: string, signatureUrl: string) => {
    if (!signatureUrl?.trim()) {
      alert("Please enter your signature URL");
      return;
    }

    try {
      console.log("🔏 Attempting to sign contract:", contractId);
      console.log("🔏 Signature URL:", signatureUrl);
      console.log("🔏 Request payload:", {
        employeeSignatureUrl: signatureUrl,
        employeeSignedAt: new Date().toISOString(),
      });
      
      const response = await axiosInstance.patch(`/onboarding/contracts/${contractId}`, {
        employeeSignatureUrl: signatureUrl,
        employeeSignedAt: new Date().toISOString(),
      });
      
      console.log("✅ Contract signed successfully:", response.data);
      alert("Contract signed successfully!");
      loadContracts(candidateId);
    } catch (err: any) {
      console.error("❌ Error signing contract:", err);
      console.error("❌ Error response data:", err.response?.data);
      console.error("❌ Error status:", err.response?.status);
      console.error("❌ Full error:", JSON.stringify(err.response, null, 2));
      
      // Handle specific error cases with detailed messages
      if (err.response?.status === 409) {
        alert("⚠️ Conflict: This contract has already been signed or cannot be modified.");
      } else if (err.response?.status === 400) {
        const errorMsg = err.response?.data?.message 
          || err.response?.data?.error 
          || JSON.stringify(err.response?.data)
          || 'Invalid request';
        alert(`❌ Bad Request: ${errorMsg}\n\nPlease check that:\n- The contract exists\n- You haven't already signed it\n- The signature URL is valid`);
      } else if (err.response?.status === 404) {
        alert("❌ Contract not found. It may have been deleted or doesn't exist.");
      } else if (err.response?.status === 403) {
        alert("❌ Permission Denied: You don't have permission to sign this contract.");
      } else if (err.response?.status === 500) {
        const serverError = err.response?.data?.message || err.response?.data?.error || 'Internal server error';
        alert(`❌ Server Error: ${serverError}\n\nPlease try again later or contact support.`);
      } else {
        // Show the most detailed error message available
        const errorMsg = err.response?.data?.message 
          || err.response?.data?.error 
          || err.message 
          || 'Unknown error occurred';
        alert(`❌ Failed to sign contract:\n\n${errorMsg}\n\nStatus: ${err.response?.status || 'Unknown'}\n\nCheck the console for more details.`);
      }
    }
  };


  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      // Force redirect even if logout fails
      router.push("/login");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div className={styles.container}>
      {/* User Info Header */}
      {candidateInfo && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px',
          backgroundColor: '#7C40A9',
          borderRadius: '12px',
          marginBottom: '30px',
          color: '#ffffff',
          border: '2px solid #9570DD',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Logged in as</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: '700' }}>{candidateInfo.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {candidateInfo.status}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.actions} style={{ marginBottom: '30px' }}>
        <Link href="/recruitment/careers" className={styles.button}>
          Browse Jobs
        </Link>
        <Link href={`/recruitment/documents/create?candidateId=${candidateId}`} className={styles.createButton}>
          Upload Document
        </Link>
      </div>

      {/* REST OF YOUR SECTIONS - Keep all existing sections unchanged */}
      {/* Notifications Section */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className={styles.pageTitle} style={{ margin: 0 }}>Notifications</h2>
          <button
            onClick={() => loadNotifications(candidateId)}
            className={styles.button}
          >
            Refresh
          </button>
        </div>
        <div className={styles.fullLine} style={{ marginBottom: '20px' }}></div>
        
        {notifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#7C40A9',
            borderRadius: '12px',
            color: '#ffffff',
            border: '2px solid #9570DD'
          }}>
            <p>No notifications</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {notifications.map((notif) => (
              <div 
                key={notif._id} 
                className={styles.card}
                style={{
                  backgroundColor: notif.readStatus ? '#7C40A9' : '#9570DD',
                  border: notif.readStatus ? '2px solid #9570DD' : '3px solid #693699'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '4px 12px',
                      backgroundColor: '#ffffff',
                      color: '#7C40A9',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>
                      {notif.type}
                    </span>
                    {!notif.readStatus && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '4px 8px',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        borderRadius: '10px'
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: '#ffffff', opacity: 0.9 }}>
                    {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5', color: '#ffffff' }}>
                  {notif.message || 'No message'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Applications Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 className={styles.pageTitle}>My Applications</h2>
        <div className={styles.fullLine}></div>
        
        {applications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#7C40A9',
            borderRadius: '12px',
            color: '#ffffff',
            border: '2px solid #9570DD'
          }}>
            <p style={{ marginBottom: '15px' }}>No applications yet</p>
            <Link href="/recruitment/careers" className={styles.createButton}>Browse Jobs →</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {applications.map((app) => (
              <div key={app._id} className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>#{app._id.slice(-6)}</span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    ...getStatusColor(app.status)
                  }}>
                    {app.status}
                  </span>
                </div>
                <p><strong>Requisition ID:</strong> {app.requisitionId?.templateId?.title || app.requisitionId?._id || 'N/A'}</p>
                <p><strong>Stage:</strong> {app.currentStage}</p>
                <p><strong>Applied:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Interviews Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 className={styles.pageTitle}>My Interviews</h2>
        <div className={styles.fullLine}></div>
        
        {interviews.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#7C40A9',
            borderRadius: '12px',
            color: '#ffffff',
            border: '2px solid #9570DD'
          }}>
            <p>No interviews scheduled yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {interviews.map((interview) => (
              <div key={interview._id} className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700' }}>Interview</span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    ...getStatusColor(interview.status?.toString().toUpperCase() || 'SCHEDULED')
                  }}>
                    {interview.status || 'SCHEDULED'}
                  </span>
                </div>
                <p><strong>Stage:</strong> {interview.stage || 'N/A'}</p>
                <p><strong>Method:</strong> {interview.method || 'N/A'}</p>
                <p><strong>Date:</strong> {interview.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString() : 'Not scheduled'}</p>
                <p><strong>Time:</strong> {interview.scheduledDate ? new Date(interview.scheduledDate).toLocaleTimeString() : 'N/A'}</p>
                <p><strong>Video Link:</strong> {interview.videoLink}</p>
                <p><strong>Your Feedback:</strong> {interview.candidateFeedback}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Offers Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 className={styles.pageTitle}>Job Offers</h2>
        <div className={styles.fullLine}></div>
        
        {offers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#7C40A9',
            borderRadius: '12px',
            color: '#ffffff',
            border: '2px solid #9570DD'
          }}>
            <p>No offers yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {offers.map((offer) => (
              <div key={offer._id} className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700' }}>{offer.role}</span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    ...getStatusColor(offer.finalStatus?.toUpperCase() || 'PENDING')
                  }}>
                    {offer.finalStatus}
                  </span>
                </div>
                <p><strong>Content:</strong> {offer.content}</p>
                <p><strong>Gross Salary:</strong> ${offer.grossSalary?.toLocaleString()}</p>
                {offer.signingBonus && (
                  <p><strong>Signing Bonus:</strong> ${offer.signingBonus.toLocaleString()}</p>
                )}
                {offer.benefits && Array.isArray(offer.benefits) && offer.benefits.length > 0 && (
                  <p><strong>Benefits:</strong> {offer.benefits.join(', ')}</p>
                )}
                <p><strong>Deadline:</strong> {new Date(offer.deadline).toLocaleDateString()}</p>
                <p><strong>Your Response:</strong> {offer.applicantResponse || 'Pending'}</p>
                {offer.candidateSignedAt && (
                  <p style={{color: '#10b981', fontSize: '14px'}}>
                    Signed on {new Date(offer.candidateSignedAt).toLocaleDateString()}
                  </p>
                )}
                
                {!offer.candidateSignedAt && offer.applicantResponse !== 'REJECTED' && (
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <select
                      value={offerResponses[offer._id] || ''}
                      onChange={(e) => setOfferResponses({...offerResponses, [offer._id]: e.target.value})}
                      className={styles.select}
                    >
                      <option value="">Select Response</option>
                      <option value="accepted">Accept</option>
                      <option value="rejected">Reject</option>
                    </select>
                    <button
                      onClick={() => handleOfferResponse(offer._id)}
                      className={styles.createButton}
                      style={{ backgroundColor: '#10b981' }}
                    >
                      Submit Response
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Preboarding Tasks Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 className={styles.pageTitle}>Preboarding Tasks</h2>
        <div className={styles.fullLine}></div>
        
        {tasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#7C40A9',
            borderRadius: '12px',
            color: '#ffffff',
            border: '2px solid #9570DD'
          }}>
            <p>No tasks assigned yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {tasks.map((taskGroup) => (
              <div key={taskGroup._id} className={styles.card}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px', color: '#ffffff' }}>Task Group</h3>
                {taskGroup.tasks.map((task: any, index: number) => (
                  <div 
                    key={index} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        checked={task.status === 'COMPLETED'}
                        onChange={() => handleTaskToggle(taskGroup._id, index, task.status)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop: '2px' }}
                      />
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: '500', margin: 0, color: '#ffffff' }}>{task.name}</p>
                        <p style={{ fontSize: '14px', margin: '4px 0', opacity: 0.8 }}>{task.department}</p>
                        {task.deadline && (
                          <p style={{ fontSize: '12px', color: '#f59e0b', margin: 0 }}>
                            Due: {new Date(task.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      ...getStatusColor(task.status)
                    }}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contracts Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 className={styles.pageTitle}>My Contracts</h2>
        <div className={styles.fullLine}></div>
        
        {contracts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#7C40A9',
            borderRadius: '12px',
            color: '#ffffff',
            border: '2px solid #9570DD'
          }}>
            <p>No contracts yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {contracts.map((contract) => (
              <ContractCard
                key={contract._id}
                contract={contract}
                onSign={(signatureUrl) => handleContractSign(contract._id, signatureUrl)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Documents Section */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className={styles.pageTitle} style={{ margin: 0 }}>My Documents</h2>
          <button
            onClick={() => loadDocuments(candidateId)}
            className={styles.button}
          >
            Refresh
          </button>
        </div>
        <div className={styles.fullLine} style={{ marginBottom: '20px' }}></div>
        
        {documents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#7C40A9',
            borderRadius: '12px',
            color: '#ffffff',
            border: '2px solid #9570DD'
          }}>
            <p style={{ marginBottom: '15px' }}>No documents uploaded yet</p>
            <Link href={`/candidate/documents/create?candidateId=${candidateId}`} className={styles.createButton}>
              Upload Document →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {documents.map((doc) => (
              <div key={doc._id} className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700' }}>{doc.documentName}</span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    ...getStatusColor(doc.type?.toUpperCase() || 'DOCUMENT')
                  }}>
                    {doc.type}
                  </span>
                </div>
                <p><strong>File:</strong> {doc.filePath}</p>
                <p><strong>Uploaded:</strong> {new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Contract Card Component
function ContractCard({ contract, onSign }: { contract: any; onSign: (url: string) => void }) {
  const [signatureUrl, setSignatureUrl] = useState('');

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#7C40A9',
      borderRadius: '12px',
      border: '2px solid #9570DD',
      color: '#ffffff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <span style={{ fontSize: '18px', fontWeight: '700' }}>Contract</span>
        <span style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: contract.employeeSignedAt ? '#10b981' : '#f59e0b',
          color: 'white'
        }}>
          {contract.employeeSignedAt ? 'Signed' : 'Pending'}
        </span>
      </div>
      <p><strong>Role:</strong> {contract.role}</p>
      <p><strong>Salary:</strong> ${contract.grossSalary?.toLocaleString()}</p>
      <p><strong>Acceptance Date:</strong> {new Date(contract.acceptanceDate).toLocaleDateString()}</p>
      
      {contract.employeeSignedAt ? (
        <p style={{color: '#10b981', marginTop: '10px'}}>
          Signed on {new Date(contract.employeeSignedAt).toLocaleDateString()}
        </p>
      ) : (
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <input
            type="text"
            placeholder="Enter signature URL"
            value={signatureUrl}
            onChange={(e) => setSignatureUrl(e.target.value)}
            style={{
              padding: '10px',
              backgroundColor: '#9570DD',
              color: '#ffffff',
              border: '2px solid #693699',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={() => onSign(signatureUrl)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sign Contract
          </button>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, any> = {
    SUBMITTED: { backgroundColor: '#3b82f6', color: 'white' },
    IN_PROCESS: { backgroundColor: '#f59e0b', color: 'white' },
    OFFER: { backgroundColor: '#10b981', color: 'white' },
    HIRED: { backgroundColor: '#059669', color: 'white' },
    REJECTED: { backgroundColor: '#ef4444', color: 'white' },
    PENDING: { backgroundColor: '#6b7280', color: 'white' },
    pending: { backgroundColor: '#6b7280', color: 'white' },
    COMPLETED: { backgroundColor: '#10b981', color: 'white' },
    APPROVED: { backgroundColor: '#10b981', color: 'white' },
    SCHEDULED: { backgroundColor: '#3b82f6', color: 'white' },
    scheduled: { backgroundColor: '#3b82f6', color: 'white' },
    CONFIRMED: { backgroundColor: '#10b981', color: 'white' },
    confirmed: { backgroundColor: '#10b981', color: 'white' },
    CANCELLED: { backgroundColor: '#ef4444', color: 'white' },
    cancelled: { backgroundColor: '#ef4444', color: 'white' },
    completed: { backgroundColor: '#10b981', color: 'white' },
    ID: { backgroundColor: '#8b5cf6', color: 'white' },
    CERTIFICATE: { backgroundColor: '#ec4899', color: 'white' },
  };
  return colors[status] || { backgroundColor: '#6b7280', color: 'white' };
}