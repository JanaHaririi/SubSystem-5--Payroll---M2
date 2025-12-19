"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";

export default function ContractsDashboardPage() {
  const [searchResult, setSearchResult] = useState<{
    type: 'contract';
    data: any;
  } | null>(null);

  const [searchError, setSearchError] = useState<string | null>(null);
  const searchResultRef = useRef<HTMLDivElement>(null);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offerMap, setOfferMap] = useState<Record<string, any>>({});
  const [documentMap, setDocumentMap] = useState<Record<string, any>>({});
  const [searchId, setSearchId] = useState("");

  // Determine what to display based on search
  const displayContracts = searchResult?.data
    ? [searchResult.data] 
    : contracts;
 
  // Load all contracts
  useEffect(() => {
    async function loadAll() {
      try {
        const response = await axiosInstance.get("/onboarding/contracts");
        setContracts(response.data);
      } catch (err) {
        console.error("Error loading contracts:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  // Load offers for all contracts
  useEffect(() => {
    async function loadOffers() {
      try {
        const response = await axiosInstance.get('/recruitment/offers');
        const allOffers = response.data;
        
        // Create a map of offerId -> offer
        const map: Record<string, any> = {};
        allOffers.forEach((offer: any) => {
          const offerIdKey = typeof offer._id === 'string' ? offer._id : offer._id.toString();
          map[offerIdKey] = offer;
        });
        
        setOfferMap(map);
      } catch (err) {
        console.error("Error loading offers:", err);
      }
    }

    if (contracts.length > 0) {
      loadOffers();
    }
  }, [contracts]);

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

    if (contracts.length > 0) {
      loadDocuments();
    }
  }, [contracts]);

  // Smooth scrolling to search result
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
    
    if (!searchId.trim()) {
      setSearchError("Please enter a contract ID");
      return;
    }

    setSearchError(null);
    setSearchResult(null);
    setLoading(true);

    try {
      const response = await axiosInstance.get(`/onboarding/contracts/${searchId.trim()}`);
      const data = response.data;
      
      if (!data || !data._id) {
        throw new Error('Invalid data received');
      }
      
      setSearchResult({ type: 'contract', data });
    } catch (err: any) {
      console.error("Search error:", err);
      setSearchError(`Contract not found with ID: ${searchId}`);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResult(null);
    setSearchError(null);
    setSearchId("");
  };

  if (loading && !searchResult) return <div className={styles.loading}>Loading...</div>;
 
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Contracts Dashboard</h1>
      <div className={styles.fullLine}></div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className={styles.card} style={{ marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0 }}>Search Contract by ID</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="contractId" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Contract ID
            </label>
            <input
              id="contractId"
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter contract ID"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #9570DD',
                backgroundColor: '#f8f9fa',
                fontSize: '15px'
              }}
            />
          </div>
          <button type="submit" className={styles.button}>
            Search
          </button>
        </div>
      </form>

      {/* Search Results Info */}
      {searchResult && searchResult.data && (
        <div className={styles.searchInfo}>
          <p>
            Showing search result for contract: <strong>{searchResult.data._id}</strong>
          </p>
          <button onClick={clearSearch} className={styles.clearButton}>
            Clear Search
          </button>
        </div>
      )}

      {/* Search Error */}
      {searchError && (
        <div className={styles.errorBanner}>
          <p>{searchError}</p>
          <button onClick={clearSearch} className={styles.clearButton}>
            Dismiss
          </button>
        </div>
      )}
     
      {/* Show Contracts */}
      <>
        <h2 className={styles.pageTitle}>Contracts</h2>

        {loading && <p className={styles.loading}>Loading...</p>}

        {!loading && displayContracts.length === 0 && (
          <p>No contracts found.</p>
        )}

        {displayContracts.map((contract) => {
          // Get related offer
          const offerIdKey = contract.offerId 
            ? (typeof contract.offerId === 'object' ? contract.offerId._id : contract.offerId)
            : null;
          const offer = offerIdKey ? offerMap[offerIdKey] : null;
          
          // Get related document
          let contractDocument = null;
          if (contract.documentId) {
            const docIdKey = typeof contract.documentId === 'string' 
              ? contract.documentId 
              : (contract.documentId._id || contract.documentId.toString());
            
            contractDocument = documentMap[docIdKey];
          }
          
          return (
            <div
              key={contract._id}
              className={`${styles.card} ${searchResult?.data?._id === contract._id ? styles.highlight : ''}`}
              ref={searchResult?.data?._id === contract._id ? searchResultRef : null}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gap: "20px",
              }}
            >
              {/* Left side - Contract details */}
              <div>
                <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', color: '#7C40A9' }}>
                  Contract Details
                </h3>
                <p><strong>Contract ID:</strong> {contract._id || 'N/A'}</p>
                <p><strong>Offer ID:</strong> {
                  contract.offerId 
                    ? (typeof contract.offerId === 'object' ? contract.offerId._id : contract.offerId)
                    : 'N/A'
                }</p>
                <p><strong>Candidate ID:</strong> {
                  contract.candidateId 
                    ? (typeof contract.candidateId === 'object' ? contract.candidateId._id : contract.candidateId)
                    : 'N/A'
                }</p>
                <p><strong>Acceptance Date:</strong> {
                  contract.acceptanceDate 
                    ? new Date(contract.acceptanceDate).toLocaleDateString() 
                    : 'N/A'
                }</p>
                <p><strong>Document ID:</strong> {
                  contract.documentId 
                    ? (typeof contract.documentId === 'object' 
                        ? (contract.documentId._id || String(contract.documentId))
                        : contract.documentId)
                    : 'N/A'
                }</p>
                <p><strong>Employee Signed At:</strong> {
                  contract.employeeSignedAt 
                    ? new Date(contract.employeeSignedAt).toLocaleString()
                    : 'Not Signed'
                }</p>
                <p><strong>Employer Signed At:</strong> {
                  contract.employerSignedAt 
                    ? new Date(contract.employerSignedAt).toLocaleString()
                    : 'Not Signed'
                }</p>
                <p><strong>Status:</strong> {
                  contract.employeeSignedAt && contract.employerSignedAt 
                    ? <span style={{ color: '#10b981', fontWeight: '700' }}>✓ Fully Signed</span>
                    : contract.employeeSignedAt || contract.employerSignedAt
                    ? <span style={{ color: '#f59e0b', fontWeight: '700' }}>⏳ Partially Signed</span>
                    : <span style={{ color: '#6b7280', fontWeight: '700' }}>⭘ Pending</span>
                }</p>
                <p><strong>Created At:</strong> {
                  contract.createdAt 
                    ? new Date(contract.createdAt).toLocaleString()
                    : 'N/A'
                }</p>
                <p><strong>Updated At:</strong> {
                  contract.updatedAt 
                    ? new Date(contract.updatedAt).toLocaleString()
                    : 'N/A'
                }</p>

                <div className={styles.actions}>
                  <Link href={`/recruitment/hr/contracts/${contract._id}/update`} className={styles.updateBtn}>
                    Update Contract
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
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Owner ID:</strong> {contractDocument.ownerId || 'N/A'}
                    </p>
                    
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                      <Link
                        href={`/hr/documents/${contractDocument._id}/update`}
                        className={styles.updateBtn}
                      >
                        Update Document
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <p style={{ color: "#ffffff", fontStyle: "italic", marginBottom: "15px", fontSize: "14px" }}>
                      No document available
                    </p>
                    <Link
                      href={`/recruitment/hr/documents/create?contractId=${contract._id}&type=contract`}
                      className={styles.createButton}
                    >
                      Create Document
                    </Link>
                  </div>
                )}
              </div>

              {/* Right side - Related Offer box */}
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
                  Related Offer
                </h3>
                {offer ? (
                  <div style={{
                    padding: "12px",
                    backgroundColor: "#9570DD",
                    borderRadius: "6px",
                    border: "2px solid #693699",
                  }}>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Offer ID:</strong> {offer._id}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Role:</strong> {offer.role || 'N/A'}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Gross Salary:</strong> {offer.grossSalary ? `$${offer.grossSalary.toLocaleString()}` : 'N/A'}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Signing Bonus:</strong> {offer.signingBonus ? `$${offer.signingBonus.toLocaleString()}` : 'N/A'}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Deadline:</strong> {offer.deadline ? new Date(offer.deadline).toLocaleDateString() : 'N/A'}
                    </p>
                    <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#ffffff" }}>
                      <strong>Final Status:</strong> {offer.finalStatus || 'N/A'}
                    </p>
                    
                    <Link
                      href={`/recruitment/hr/offers/${offer._id}/update`}
                      className={styles.updateBtn}
                      style={{ marginTop: "8px" }}
                    >
                      View Offer
                    </Link>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <p style={{ color: "#ffffff", fontStyle: "italic", fontSize: "14px" }}>
                      No offer linked
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </>

      {/* Action links */}
      <div className={styles.actions} style={{ marginTop: '30px' }}>
        <Link href="/recruitment/hr/contracts/create" className={styles.button}>Create Contract</Link>
      </div>
    </div>
  );
}