"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";import ConfirmDialog from "@/app/recruitment/component/ConfirmDialog";
import SearchForm from "@/app/recruitment/component/search-form";

export default function HrDashboardPage() {
  const [searchResult, setSearchResult] = useState<{
    type: 'requisition' | 'template';
    data: any;
  } | null>(null);

  const [searchError, setSearchError] = useState<string | null>(null);
  const searchResultRef = useRef<HTMLDivElement>(null);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: '',
    title: '',
    type: 'requisition' as 'requisition' | 'template'
  });
 
  //load all 
useEffect(() => {
  async function loadAll() {
    try {
      const [reqsResponse, tempsResponse] = await Promise.all([
        axiosInstance.get("/recruitment/requisitions"),
        axiosInstance.get("/recruitment/templates"),
      ]);

      setRequisitions(reqsResponse.data);
      setTemplates(tempsResponse.data);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  loadAll();
}, []);

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
  const handleDeleteClick = (id: string, title: string, type: 'requisition' | 'template') => {
    setConfirmDialog({ isOpen: true, id, title, type });
  };

  const handleConfirmDelete = async () => {
  try {
    if (confirmDialog.type === 'requisition') {
      await axiosInstance.delete(`/recruitment/requisitions/${confirmDialog.id}`);
      setRequisitions(requisitions.filter(r => r._id !== confirmDialog.id));
    } else {
      await axiosInstance.delete(`/recruitment/templates/${confirmDialog.id}`);
      setTemplates(templates.filter(t => t._id !== confirmDialog.id));
    }
    alert('Deleted successfully!');
    
    if (searchResult?.data?._id === confirmDialog.id) {
      clearSearch();
    }
  } catch (err: any) {
    alert(`Failed to delete: ${err.message}`);
  } finally {
    setConfirmDialog({ isOpen: false, id: '', title: '', type: 'requisition' });
  }
};
//search
  const handleSearch = async (id: string, type: 'requisition' | 'template') => {
  setSearchError(null);
  setSearchResult(null);
  setLoading(true);

  try {
    let response;
    
    if (type === 'requisition') {
      response = await axiosInstance.get(`/recruitment/requisitions/${id}`);
    } else {
      response = await axiosInstance.get(`/recruitment/templates/${id}`);
    }
    
    const data = response.data;
    console.log('Search result:', data);
    
    if (!data || !data._id) {
      throw new Error('Invalid data received');
    }
    
    setSearchResult({ type, data });
  } catch (err: any) {
    console.error("Search error:", err);
    setSearchError(`${type} not found with ID: ${id}`);
  } finally {
    setLoading(false);
  }
};

  const clearSearch = () => {
    setSearchResult(null);
    setSearchError(null);
  };

  if (loading && !searchResult) return <div className={styles.loading}>Loading...</div>;

  // Determine what to display based on search
  const displayRequisitions = searchResult?.type === 'requisition' && searchResult.data
    ? [searchResult.data] 
    : requisitions;
  
  const displayTemplates = searchResult?.type === 'template' && searchResult.data
    ? [searchResult.data] 
    : templates;
 
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Job Template & Requisitions</h1>
      <div className={styles.fullLine}></div>

      {/* Search Form */}
      <SearchForm onSearch={handleSearch} />

      {/* Search Results Info */}
      {searchResult && searchResult.data && (
        <div className={styles.searchInfo}>
          <p>
            Showing search result for {searchResult.type}: <strong>{searchResult.data._id}</strong>
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
     
      {/*  ONLY SHOW REQUISITIONS if no search OR searching for requisitions */}
      {(!searchResult || searchResult.type === 'requisition') && (
        <>
          <h2 className={styles.pageTitle}>Job Requisitions</h2>

          {loading && <p className={styles.loading}>Loading...</p>}

          {!loading && displayRequisitions.length === 0 && (
            <p>No requisitions found.</p>
          )}

          {displayRequisitions.map((req) => (
            <div
              key={req._id} 
              className={`${styles.card} ${searchResult?.data?._id === req._id ? styles.highlight : ''}`}
              ref={searchResult?.data?._id === req._id ? searchResultRef : null}
            >
              <p><strong>ID:</strong> {req._id}</p>
              <p><strong>Title:</strong> {req.templateId?.title}</p>
              <p><strong>Status:</strong> {req.publishStatus}</p>
              <p><strong>Location:</strong> {req.location}</p>
              <p><strong>Openings:</strong> {req.openings}</p>
              <p><strong>Requisition ID:</strong> {req.requisitionId}</p>

              <div className={styles.actions}>
                <Link
                  href={`/recruitment/hr/requisitions/${req._id}/update`}
                  className={styles.updateBtn}
                >
                  Update
                </Link>

                <button 
                  onClick={() => handleDeleteClick(
                    req._id, 
                    req.templateId?.title || 'this requisition', 
                    'requisition'
                  )}
                  className={styles.deleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/*  ONLY SHOW TEMPLATES if no search OR searching for templates */}
      {(!searchResult || searchResult.type === 'template') && (
        <>
          <h2 className={styles.pageTitle}>Job Templates</h2>

          {loading && <p className={styles.loading}>Loading...</p>}

          {!loading && displayTemplates.length === 0 && (
            <p>No templates found.</p>
          )}

          {displayTemplates.map((template) => (
            <div 
              key={template._id} 
              className={`${styles.card} ${searchResult?.data?._id === template._id ? styles.highlight : ''}`}
              ref={searchResult?.data?._id === template._id ? searchResultRef : null}
            >
              <p><strong>ID:</strong> {template._id}</p>
              <p><strong>Title:</strong> {template.title}</p>
              <p><strong>Department:</strong> {template.department}</p>
              <p><strong>Qualifications:</strong> {template.qualifications}</p>
              <p><strong>Skills:</strong> {template.skills}</p>
              <p><strong>Description:</strong> {template.description}</p>
              <div className={styles.actions}>
                <Link
                  href={`/recruitment/hr/templates/${template._id}/update`}
                  className={styles.updateBtn}
                >
                  Update
                </Link>

                <button
                  onClick={() => handleDeleteClick(
                    template._id, 
                    template.title, 
                    'template'
                  )}
                  className={styles.deleteBtn}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Action links */}
      <div className={styles.actions} style={{ marginTop: '30px' }}>
        <Link href="/recruitment/hr/requisitions/" className={styles.createButton}>
          Create Job Requisition
        </Link>
        <Link href="/recruitment/hr/templates/" className={styles.createButton}>
          Create Job Template
        </Link>
        
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, id: '', title: '', type: 'requisition' })}
      />
    </div>
  );
}