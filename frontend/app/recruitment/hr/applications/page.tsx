"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";

export default function ApplicationPage() {
  const [searchResult, setSearchResult] = useState<{
    type: "application";
    data: any;
  } | null>(null);

  const [searchError, setSearchError] = useState<string | null>(null);
  const searchResultRef = useRef<HTMLDivElement>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all applications
  useEffect(() => {
    async function loadAll() {
      try {
        const applicationResponse = await axiosInstance.get("/recruitment/applications");
        setApplications(applicationResponse.data);
      } catch (err) {
        console.error("Error loading applications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // Smooth scrolling after search
  useEffect(() => {
    if (searchResult && searchResultRef.current) {
      setTimeout(() => {
        searchResultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [searchResult]);

  // Search handler for applications
  const handleApplicationSearch = async (id: string) => {
    setSearchError(null);
    setSearchResult(null);
    setLoading(true);

    try {
      const response = await axiosInstance.get(`/recruitment/applications/${id}`);
      const data = response.data;

      if (!data || !data._id) throw new Error("Invalid data received");

      setSearchResult({ type: "application", data });
    } catch (err) {
      console.error("Search error:", err);
      setSearchError(`Application not found with ID: ${id}`);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResult(null);
    setSearchError(null);
  };

  if (loading && !searchResult) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Determine what to display based on search result
  const displayApplications =
    searchResult?.type === "application" && searchResult?.data
      ? [searchResult.data]
      : applications || [];

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Applications Dashboard</h1>
      <div className={styles.fullLine}></div>

      {/* Search Form */}
      <div className={styles.searchSection}>
        <input
          type="text"
          placeholder="Search by Application ID"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleApplicationSearch((e.target as HTMLInputElement).value);
            }
          }}
          className={styles.searchInput}
        />
        <button
          onClick={(e) => {
            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
            handleApplicationSearch(input.value);
          }}
          className={styles.searchButton}
        >
          Search
        </button>
      </div>

      {/* Search Results Info */}
      {searchResult && searchResult.data && (
        <div className={styles.searchInfo}>
          <p>
            Showing search result for application:{" "}
            <strong>{searchResult.data._id}</strong>
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

      {/* Applications List */}
      {loading && <p className={styles.loading}>Loading...</p>}

      {!loading && displayApplications.length === 0 && (
        <p>No applications found.</p>
      )}

      {displayApplications.map((app) => (
        <div
          key={app._id}
          className={`${styles.card} ${
            searchResult?.data?._id === app._id ? styles.highlight : ""
          }`}
          ref={searchResult?.data?._id === app._id ? searchResultRef : null}
        >
          <p>
            <strong>Application ID:</strong> {app._id}
          </p>
          <p>
            <strong>Candidate ID:</strong> {app.candidateId}
          </p>
          <p>
            <strong>HR ID:</strong> {app.assignedHr}
          </p>
          <p>
            <strong>Current Stage:</strong> {app.currentStage}
          </p>
          <p>
            <strong>Status:</strong> {app.status}
          </p>

          <div className={styles.actions}>
            <Link 
              href={`/recruitment/hr/applications/${app._id}/update`} 
              className={styles.updateBtn}
            >
              Update Application
            </Link>
            <Link 
              href={`/recruitment/hr/applications/applicationHistory/${app._id}`} 
              className={styles.referralBtn}
            >
              View Application History
            </Link>
            <Link 
              href={`/recruitment/hr/applications/referrals`} 
              className={styles.referralBtn}
            >
              Create Referral
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}