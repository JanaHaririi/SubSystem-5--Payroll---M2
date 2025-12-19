"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import ConfirmDialog from "@/app/recruitment/component/ConfirmDialog";

export enum DocumentType {
  CV = 'cv',
  CONTRACT = 'contract',
  ID = 'id',
  CERTIFICATE = 'certificate',
  RESIGNATION = 'resignation',
}

interface Document {
  _id: string;
  ownerId: string;
  type: DocumentType;
  filePath: string;
  uploadedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function ContractDocumentPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contractDocuments, setContractDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<Document | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchResultRef = useRef<HTMLDivElement>(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: '',
    title: '',
  });

  // Determine what to display based on search
  const displayDocuments = searchResult 
    ? [searchResult] 
    : contractDocuments;

  // Load all documents and filter for contracts
  useEffect(() => {
    async function loadAllDocuments() {
      try {
        const response = await axiosInstance.get("/onboarding/documents");
        const allDocs = response.data;
        setDocuments(allDocs);
        
        // Filter for contract documents only
        const contracts = allDocs.filter((doc: Document) => doc.type === DocumentType.CONTRACT);
        setContractDocuments(contracts);
      } catch (err) {
        console.error("Error loading documents:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAllDocuments();
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

  // Search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setSearchResult(null);

    if (!searchId.trim()) {
      setSearchError('Please enter a document ID');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.get(`/onboarding/documents/${searchId}`);
      const data = response.data;
      
      if (!data || !data._id) {
        throw new Error('Invalid data received');
      }

      // Check if it's a contract document
      if (data.type !== DocumentType.CONTRACT) {
        setSearchError(`Document found but it's not a contract (Type: ${data.type})`);
        setLoading(false);
        return;
      }
      
      setSearchResult(data);
    } catch (err: any) {
      console.error("Search error:", err);
      setSearchError(`Document not found with ID: ${searchId}`);
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
  const handleDeleteClick = (id: string, ownerId: string) => {
    setConfirmDialog({ isOpen: true, id, title: `Contract for Owner: ${ownerId}` });
  };

  const handleConfirmDelete = async () => {
    try {
      await axiosInstance.delete(`/onboarding/documents/${confirmDialog.id}`);
      
      // Update both lists
      setDocuments(documents.filter(doc => doc._id !== confirmDialog.id));
      setContractDocuments(contractDocuments.filter(doc => doc._id !== confirmDialog.id));
      
      alert('Contract document deleted successfully!');
      
      if (searchResult?._id === confirmDialog.id) {
        clearSearch();
      }
    } catch (err: any) {
      alert(`Failed to delete: ${err.response?.data?.message || err.message}`);
    } finally {
      setConfirmDialog({ isOpen: false, id: '', title: '' });
    }
  };

  if (loading && !searchResult) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Contract Documents Dashboard</h1>
      <div className={styles.fullLine}></div>

      {/* Search Form */}
      <div className={styles.card} style={{ marginBottom: '20px' }}>
        <h2 className={styles.pageTitle}>Search Contract Document</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Enter Document ID"
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
      </div>

      {/* Search Results Info */}
      {searchResult && (
        <div className={styles.searchInfo}>
          <p>
            Showing search result for contract document: <strong>{searchResult._id}</strong>
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

      {/* Contract Documents List */}
      <h2 className={styles.pageTitle}>
        Contract Documents ({displayDocuments.length})
      </h2>

      {!loading && displayDocuments.length === 0 && (
        <p>No contract documents found.</p>
      )}

      {displayDocuments.map((doc) => (
        <div
          key={doc._id}
          className={`${styles.card} ${searchResult?._id === doc._id ? styles.highlight : ''}`}
          ref={searchResult?._id === doc._id ? searchResultRef : null}
        >
          <div style={{ marginBottom: '15px' }}>
            <p><strong>Document ID:</strong> {doc._id}</p>
            <p><strong>Owner ID:</strong> {doc.ownerId}</p>
            <p><strong>Type:</strong> {doc.type}</p>
            <p><strong>File Path:</strong> {doc.filePath}</p>
            <p><strong>Uploaded At:</strong> {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}</p>
            {doc.createdAt && (
              <p><strong>Created At:</strong> {new Date(doc.createdAt).toLocaleString()}</p>
            )}
            {doc.updatedAt && (
              <p><strong>Updated At:</strong> {new Date(doc.updatedAt).toLocaleString()}</p>
            )}
          </div>

          <div className={styles.actions}>
            <Link
              href={`/recruitment/hr/documents/${doc._id}/update`}
              className={styles.updateBtn}
            >
              Update Document
            </Link>
            
            <button
              onClick={() => handleDeleteClick(doc._id, doc.ownerId.toString())}
              className={styles.deleteBtn}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Delete Document
            </button>
          </div>
        </div>
      ))}

      {/* Action links */}
      <div className={styles.actions} style={{ marginTop: '30px' }}>
        <Link href="/recruitment/hr/documents/create" className={styles.button}>
          Create Contract Document
        </Link>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, id: '', title: '' })}
      />
    </div>
  );
}