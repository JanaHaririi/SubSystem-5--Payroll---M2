"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import ConfirmDialog from "@/app/recruitment/component/ConfirmDialog";

interface Task {
  name: string;
  department: string;
  deadline?: Date;
  status: string;
  completedAt?: Date;
}

interface Checklist {
  _id: string;
  employeeId: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export default function OnboardingChecklistDashboard() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<Checklist | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchResultRef = useRef<HTMLDivElement>(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    checklistId: '',
    taskIndex: -1,
    taskName: '',
  });

  // Determine what to display based on search
  const displayChecklists = searchResult 
    ? [searchResult] 
    : checklists;

  // Load all checklists
  useEffect(() => {
    async function loadAllChecklists() {
      try {
        const response = await axiosInstance.get("/onboarding/tasks");
        setChecklists(response.data);
      } catch (err) {
        console.error("Error loading checklists:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAllChecklists();
  }, []);

  // Smooth scroll to search result
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

  // Validate ObjectId format
  const isValidObjectId = (id: string): boolean => {
    return /^[a-fA-F0-9]{24}$/.test(id);
  };

  // Search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setSearchResult(null);

    if (!searchId.trim()) {
      setSearchError('Please enter a checklist ID');
      return;
    }

    // Validate ObjectId format
    if (!isValidObjectId(searchId.trim())) {
      setSearchError('Invalid checklist ID format. ID must be a 24-character hexadecimal string');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.get(`/onboarding/tasks/${searchId.trim()}`);
      const data = response.data;
      
      if (!data || !data._id) {
        throw new Error('Invalid data received');
      }
      
      setSearchResult(data);
    } catch (err: any) {
      console.error("Search error:", err);
      if (err.response?.status === 404) {
        setSearchError(`Checklist not found with ID: ${searchId}`);
      } else {
        setSearchError(`Error searching for checklist: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResult(null);
    setSearchError(null);
    setSearchId('');
  };

  // Delete handlers
  const handleDeleteClick = (checklistId: string, taskIndex: number, taskName: string) => {
    setConfirmDialog({ isOpen: true, checklistId, taskIndex, taskName });
  };

  const handleConfirmDelete = async () => {
    try {
      await axiosInstance.delete(`/onboarding/tasks/${confirmDialog.checklistId}/${confirmDialog.taskIndex}`);
      
      // Refresh the list
      const response = await axiosInstance.get("/onboarding/tasks");
      setChecklists(response.data);
      
      alert('Task deleted successfully!');
      
      if (searchResult?._id === confirmDialog.checklistId) {
        clearSearch();
      }
    } catch (err: any) {
      alert(`Failed to delete task: ${err.response?.data?.message || err.message}`);
    } finally {
      setConfirmDialog({ isOpen: false, checklistId: '', taskIndex: -1, taskName: '' });
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      PENDING: { backgroundColor: '#f59e0b', color: 'white' },
      COMPLETED: { backgroundColor: '#10b981', color: 'white' },
      IN_PROGRESS: { backgroundColor: '#3b82f6', color: 'white' },
    };
    return colors[status] || { backgroundColor: '#6b7280', color: 'white' };
  };

  if (loading && !searchResult) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>📋 Onboarding Checklists Dashboard</h1>
      <div className={styles.fullLine}></div>

      {/* Search Form */}
      <div className={styles.card} style={{ marginBottom: '20px' }}>
        <h2 className={styles.pageTitle} style={{ fontSize: '24px' }}>Search Checklist</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '15px' }}>
          <input
            type="text"
            placeholder="Enter Checklist ID (e.g., 507f1f77bcf86cd799439011)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className={styles.input}
            style={{ flex: 1 }}
          />
          <button type="submit" className={styles.button}>
            Search
          </button>
          {(searchResult || searchError) && (
            <button type="button" onClick={clearSearch} className={styles.clearButton}>
              Clear
            </button>
          )}
        </form>
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#e9d5ff', margin: '10px 0 0 0' }}>
          Note: Checklist IDs are 24-character hexadecimal strings. You can copy an ID from the list below.
        </p>
      </div>

      {/* Search Results Info */}
      {searchResult && (
        <div className={styles.searchInfo}>
          <p>
            Showing search result for checklist: <strong>{searchResult._id}</strong>
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

      {/* Checklists List */}
      <h2 className={styles.pageTitle}>All Checklists ({displayChecklists.length})</h2>

      {!loading && displayChecklists.length === 0 && (
        <p style={{ color: '#7C40A9', fontSize: '16px' }}>No checklists found.</p>
      )}

      {displayChecklists.map((checklist) => (
        <div
          key={checklist._id}
          className={`${styles.card} ${searchResult?._id === checklist._id ? styles.highlight : ''}`}
          ref={searchResult?._id === checklist._id ? searchResultRef : null}
        >
          {/* Checklist Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid rgba(255, 255, 255, 0.3)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                  <strong>Checklist ID:</strong>
                </p>
                <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{checklist._id}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(checklist._id);
                    alert('Checklist ID copied to clipboard!');
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    backgroundColor: '#9570DD',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                >
                  Copy ID
                </button>
              </div>
              <p style={{ margin: '5px 0' }}><strong>Employee ID:</strong> {checklist.employeeId}</p>
              <p style={{ margin: '5px 0' }}><strong>Created:</strong> {new Date(checklist.createdAt).toLocaleDateString()}</p>
            </div>
            <div className={styles.actions}>
              <Link
                href={`/recruitment/hr/onboardingChecklist/${checklist._id}/update`}
                className={styles.updateBtn}
              >
                Update Checklist
              </Link>
            </div>
          </div>

          {/* Tasks List */}
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px', color: '#ffffff' }}>
            Tasks ({checklist.tasks.length})
          </h3>
          
          {checklist.tasks.length === 0 ? (
            <p style={{ color: '#e9d5ff', fontStyle: 'italic' }}>No tasks in this checklist</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {checklist.tasks.map((task: Task, index: number) => (
                <div 
                  key={index}
                  style={{
                    padding: '15px',
                    backgroundColor: '#7C40A9',
                    borderRadius: '8px',
                    border: '2px solid #9570DD',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{task.name}</p>
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
                    <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Department:</strong> {task.department}</p>
                    {task.deadline && (
                      <p style={{ margin: '5px 0', fontSize: '14px', color: '#f59e0b' }}>
                        <strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    )}
                    {task.completedAt && (
                      <p style={{ margin: '5px 0', fontSize: '14px', color: '#10b981' }}>
                        <strong>Completed:</strong> {new Date(task.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteClick(checklist._id, index, task.name)}
                    className={styles.deleteBtn}
                    style={{ marginLeft: 'auto' }}
                  >
                    Delete Task
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Action links */}
      <div className={styles.actions} style={{ marginTop: '30px' }}>
        <Link href="/recruitment/hr/onboardingChecklist/create" className={styles.createButton}>
          + Create New Checklist
        </Link>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Delete"
        message={`Are you sure you want to delete the task "${confirmDialog.taskName}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, checklistId: '', taskIndex: -1, taskName: '' })}
      />
    </div>
  );
}