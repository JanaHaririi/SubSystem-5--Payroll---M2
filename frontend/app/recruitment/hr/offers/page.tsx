"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import GenericForm, { FieldConfig } from "@/app/recruitment/component/generic-form";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";
import FormPageWrapper from "@/app/recruitment/component/FormPageWrapper";
import SearchFormOffer from "./SearchFormOffer";
import ConfirmDialog from "@/app/recruitment/component/ConfirmDialog";

export default function OfferDashboardPage() {
  const [searchResult, setSearchResult] = useState<{
    type: 'offer' | 'contract';
    data: any;
  } | null>(null);

  const [searchError, setSearchError] = useState<string | null>(null);
  const searchResultRef = useRef<HTMLDivElement>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractMap, setContractMap] = useState<Record<string, any>>({});
  const [documentMap, setDocumentMap] = useState<Record<string, any>>({});
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    id: '',
    title: '',
    type: 'offer' as 'offer' | 'document'
  });

  // Determine what to display based on search - MOVED UP BEFORE USE
  const displayOffers = searchResult?.data
    ? [searchResult.data] 
    : offers;
 
  //load all offers
  useEffect(() => {
    async function loadAll() {
      try {
        const response = await axiosInstance.get("/recruitment/offers");
        setOffers(response.data);
      } catch (err) {
        console.error("Error loading offers:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  // Load contracts for all offers
  useEffect(() => {
    async function loadContracts() {
      try {
        const response = await axiosInstance.get('/onboarding/contracts');
        const allContracts = response.data;
        
        // Create a map of offerId -> contract
        const map: Record<string, any> = {};
        allContracts.forEach((contract: any) => {
          if (contract.offerId) {
            // Extract the actual ID string from the offerId object
            const offerIdKey = contract.offerId._id || contract.offerId;
            map[offerIdKey] = contract;
          }
        });
        
        setContractMap(map);
      } catch (err) {
        console.error("Error loading contracts:", err);
      }
    }

    if (offers.length > 0) {
      loadContracts();
    }
  }, [offers]);

  // Load documents (contract documents)
  useEffect(() => {
    async function loadDocuments() {
      try {
        const response = await axiosInstance.get('/onboarding/documents');
        const allDocuments = response.data;
        
        // Create a map of documentId -> document (only contract type)
        const map: Record<string, any> = {};
        allDocuments.forEach((doc: any) => {
          if (doc.type === 'contract') {
            const docIdKey = typeof doc._id === 'string' 
              ? doc._id 
              : doc._id.toString();
            
            map[docIdKey] = doc;
          }
        });
        
        setDocumentMap(map);
      } catch (err) {
        console.error("Error loading documents:", err);
      }
    }

    if (offers.length > 0) {
      loadDocuments();
    }
  }, [offers]);

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
  const handleDeleteClick = (id: string, title: string, type: 'offer' | 'document') => {
    setConfirmDialog({ isOpen: true, id, title, type });
  };

  const handleConfirmDelete = async () => {
    try {
      if (confirmDialog.type === 'document') {
        await axiosInstance.delete(`/onboarding/documents/${confirmDialog.id}`);
        // Refresh documents
        const response = await axiosInstance.get('/onboarding/documents');
        const allDocuments = response.data;
        const map: Record<string, any> = {};
        allDocuments.forEach((doc: any) => {
          if (doc.type === 'contract') {
            const docIdKey = typeof doc._id === 'string' ? doc._id : doc._id.toString();
            map[docIdKey] = doc;
          }
        });
        setDocumentMap(map);
        alert('Document deleted successfully!');
      } else {
        await axiosInstance.delete(`/recruitment/offers/${confirmDialog.id}`);
        setOffers(offers.filter(o => o._id !== confirmDialog.id));
        alert('Offer deleted successfully!');
        
        if (searchResult?.data?._id === confirmDialog.id) {
          clearSearch();
        }
      }
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setConfirmDialog({ isOpen: false, id: '', title: '', type: 'offer' });
    }
  };

  //search
  const handleSearch = async (id: string, type: 'offer' | 'contract') => {
    setSearchError(null);
    setSearchResult(null);
    setLoading(true);

    try {
      let response;
      
      if (type === 'offer') {
        response = await axiosInstance.get(`/recruitment/offers/${id}`);
      } else {
        response = await axiosInstance.get(`/onboarding/contracts/${id}`);
      }
      
      const data = response.data;
      
      if (!data || !data._id) {
        throw new Error('Invalid data received');
      }
      
      setSearchResult({ type, data });
    } catch (err: any) {
      console.error("Search error:", err);
      setSearchError(`${type.charAt(0).toUpperCase() + type.slice(1)} not found with ID: ${id}`);
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
      <h1 className={styles.pageTitle}>Job Offers Dashboard</h1>
      <div className={styles.fullLine}></div>

      {/* Search Form */}
      <SearchFormOffer onSearch={handleSearch} />

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
     
      {/* Show Offers */}
      <>
        <h2 className={styles.pageTitle}>Job Offers</h2>

        {loading && <p className={styles.loading}>Loading...</p>}

        {!loading && displayOffers.length === 0 && (
          <p>No offers found.</p>
        )}

        {displayOffers.map((offer) => {
          const offerIdKey = typeof offer._id === 'string' ? offer._id : offer._id.toString();
          const contract = contractMap[offerIdKey];
          
          let contractDocument = null;
          if (contract?.documentId) {
            const docIdKey = typeof contract.documentId === 'string' 
              ? contract.documentId 
              : (contract.documentId._id || contract.documentId.toString());
            
            contractDocument = documentMap[docIdKey];
          }
          
          return (
            <div
              key={offer._id}
              className={`${styles.card} ${searchResult?.data?._id === offer._id ? styles.highlight : ''}`}
              ref={searchResult?.data?._id === offer._id ? searchResultRef : null}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gap: "20px",
              }}
            >
              {/* Left side - Offer details */}
              <div>
                <p><strong>ID:</strong> {offer._id || 'N/A'}</p>
                <p><strong>Application ID:</strong> {
                  offer.applicationId 
                    ? (typeof offer.applicationId === 'object' ? offer.applicationId._id : offer.applicationId)
                    : 'N/A'
                }</p>
                <p><strong>Candidate ID:</strong> {
                  offer.candidateId 
                    ? (typeof offer.candidateId === 'object' ? offer.candidateId._id : offer.candidateId)
                    : 'N/A'
                }</p>
                <p><strong>HR Employee ID:</strong> {
                  offer.hrEmployeeId 
                    ? (typeof offer.hrEmployeeId === 'object' ? offer.hrEmployeeId._id : offer.hrEmployeeId)
                    : 'N/A'
                }</p>
                <p><strong>Role:</strong> {offer.role || 'N/A'}</p>
                <p><strong>Content:</strong> {offer.content || 'N/A'}</p>
                <p><strong>Gross Salary:</strong> {offer.grossSalary ? `$${offer.grossSalary.toLocaleString()}` : 'N/A'}</p>
                <p><strong>Signing Bonus:</strong> {offer.signingBonus ? `$${offer.signingBonus.toLocaleString()}` : 'N/A'}</p>
                <p><strong>Benefits:</strong> {
                  offer.benefits && Array.isArray(offer.benefits) && offer.benefits.length > 0
                    ? offer.benefits.join(', ')
                    : 'N/A'
                }</p>
                <p><strong>Conditions:</strong> {offer.conditions || 'N/A'}</p>
                <p><strong>Insurances:</strong> {offer.insurances || 'N/A'}</p>
                <p><strong>Deadline:</strong> {offer.deadline ? new Date(offer.deadline).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Candidate Signed At:</strong> {offer.candidateSignedAt ? new Date(offer.candidateSignedAt).toLocaleDateString() : 'Not Signed'}</p>
                <p><strong>HR Signed At:</strong> {offer.hrSignedAt ? new Date(offer.hrSignedAt).toLocaleDateString() : 'Not Signed'}</p>
                <p><strong>Manager Signed At:</strong> {offer.managerSignedAt ? new Date(offer.managerSignedAt).toLocaleDateString() : 'Not Signed'}</p>
                <p><strong>Applicant Response:</strong> {offer.applicantResponse || 'N/A'}</p>
                <p><strong>Final Status:</strong> {offer.finalStatus || 'N/A'}</p>
                <p><strong>Approvers:</strong> {
                  offer.approvers && Array.isArray(offer.approvers) && offer.approvers.length > 0
                    ? `${offer.approvers.length} approver(s)`
                    : 'No approvers'
                }</p>

                <div className={styles.actions}>
                  <Link href={`/recruitment/hr/offers/${offer._id}/update`} className={styles.updateBtn}>
                    Update Offer
                  </Link>
                </div>
              </div>

              {/* Middle - Contract Document box */}
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
                  Contract Document
                </h3>
                {contractDocument ? (
                  <div style={{
                    padding: "12px",
                    backgroundColor: "#9570DD",
                    borderRadius: "6px",
                    border: "2px solid #693699",
                  }}>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Document ID:</strong> {contractDocument._id}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Name:</strong> {contractDocument.documentName || 'N/A'}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Type:</strong> {contractDocument.type}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>File Path:</strong> {contractDocument.filePath || 'N/A'}
                    </p>
                    
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                      <Link
                        href={`/recruitment/hr/documents/${contractDocument._id}/update`}
                        className={styles.updateBtn}
                      >
                        Update Document
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(contractDocument._id, `Document ${contractDocument._id}`, 'document')}
                        className={styles.deleteBtn}
                      >
                        Delete Document
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <p style={{ color: "#ffffff", fontStyle: "italic", marginBottom: "15px", fontSize: "14px" }}>
                      No document available
                    </p>
                    <Link
                      href={`/recruitment/hr/documents/create?contractId=${contract?._id || ''}&offerId=${offer._id}&type=contract`}
                      className={styles.createButton}
                    >
                      Create Document
                    </Link>
                  </div>
                )}
              </div>

              {/* Right side - Contract box */}
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
                  Contract
                </h3>
                {contract ? (
                  <div style={{
                    padding: "12px",
                    backgroundColor: "#9570DD",
                    borderRadius: "6px",
                    border: "2px solid #693699",
                  }}>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Contract ID:</strong> {contract._id}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Acceptance Date:</strong> {contract.acceptanceDate ? new Date(contract.acceptanceDate).toLocaleDateString() : 'N/A'}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Document ID:</strong> {
                        contract.documentId 
                          ? (typeof contract.documentId === 'object' 
                              ? (contract.documentId._id || String(contract.documentId))
                              : contract.documentId)
                          : 'N/A'
                      }
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Employee Signed:</strong> {contract.employeeSignedAt ? new Date(contract.employeeSignedAt).toLocaleDateString() : 'Not Signed'}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Employer Signed:</strong> {contract.employerSignedAt ? new Date(contract.employerSignedAt).toLocaleDateString() : 'Not Signed'}
                    </p>
                    
                    <Link
                      href={`/recruitment/hr/contracts/${contract._id}/update`}
                      className={styles.updateBtn}
                      style={{ marginTop: "8px" }}
                    >
                      Update Contract
                    </Link>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <p style={{ color: "#ffffff", fontStyle: "italic", marginBottom: "15px", fontSize: "14px" }}>
                      No contract linked
                    </p>
                    <Link
                      href={`/recruitment/hr/contracts/create?offerId=${offer._id}`}
                      className={styles.createButton}
                    >
                      Create Contract
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </>

      {/* Action links */}
      <div className={styles.actions} style={{ marginTop: '30px' }}>
        <Link href="/recruitment/hr/offers/create" className={styles.button}>Create Offer</Link>
        <Link href="/recruitment/hr/contracts" className={styles.button}>View All contracts</Link>
        <Link href="/recruitment/hr/documents" className={styles.button}>View all contract documents</Link>
        <Link href="/recruitment/hr/onboardingChecklist" className={styles.button}>onboarding checklist</Link>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, id: '', title: '', type: 'offer' })}
      />
    </div>
  );
}