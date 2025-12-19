"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';import SearchForm from "@/app/recruitment/component/search-form";

export default function CareerPage() {
  const [searchResult, setSearchResult] = useState<{
    type: "requisition";
    data: any;
  } | null>(null);

  const [searchError, setSearchError] = useState<string | null>(null);
  const searchResultRef = useRef<HTMLDivElement>(null);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all published requisitions
  useEffect(() => {
    async function loadAll() {
      try {
        const reqsResponse = await axiosInstance.get("/recruitment/requisitions");
        const publishedReqs = reqsResponse.data.filter(
          (req: any) => req.publishStatus === "published"
        );
        setRequisitions(publishedReqs);
      } catch (err) {
        console.error("Error loading dashboard:", err);
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

  // Search
  const handleSearch = async (id: string, type: "requisition") => {
    setSearchError(null);
    setSearchResult(null);
    setLoading(true);

    try {
      const response = await axiosInstance.get(`/recruitment/requisitions/${id}`);
      const data = response.data;

      if (!data || !data._id) throw new Error("Invalid data received");

      setSearchResult({ type, data });
    } catch (err) {
      console.error("Search error:", err);
      setSearchError(`Requisition not found with ID: ${id}`);
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
  const displayRequisitions =
    searchResult?.type === "requisition" && searchResult?.data
      ? [searchResult.data]
      : requisitions || [];

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div style={{
        textAlign: "center",
        padding: "60px 20px",
        background: "linear-gradient(135deg, #7C40A9 0%, #9570DD 100%)",
        borderRadius: "12px",
        marginBottom: "40px",
        color: "#ffffff"
      }}>
        <h1 style={{
          fontSize: "48px",
          fontWeight: "700",
          marginBottom: "20px",
          fontFamily: "'Roboto', sans-serif"
        }}>
          Join Our Team
        </h1>
        <p style={{
          fontSize: "20px",
          maxWidth: "800px",
          margin: "0 auto",
          lineHeight: "1.6",
          fontFamily: "'Roboto Condensed', sans-serif"
        }}>
          Discover exciting career opportunities and become part of our innovative team. 
          We're looking for passionate individuals ready to make an impact.
        </p>
      </div>

      {/* Company Culture Section */}
      <div style={{
        marginBottom: "50px",
        padding: "30px",
        backgroundColor: "#faf5ff",
        borderRadius: "12px",
        border: "2px solid #9570DD"
      }}>
        <h2 className={styles.pageTitle} style={{ textAlign: "center", marginBottom: "20px" }}>
          Why Work With Us?
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "30px"
        }}>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>💡</div>
            <h3 style={{ color: "#7C40A9", fontSize: "20px", fontWeight: "700", marginBottom: "10px" }}>
              Innovation First
            </h3>
            <p style={{ color: "#4a5568", fontSize: "14px", lineHeight: "1.6" }}>
              Work on cutting-edge projects that shape the future of our industry
            </p>
          </div>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>💼</div>
            <h3 style={{ color: "#7C40A9", fontSize: "20px", fontWeight: "700", marginBottom: "10px" }}>
              Career Growth
            </h3>
            <p style={{ color: "#4a5568", fontSize: "14px", lineHeight: "1.6" }}>
              Continuous learning opportunities and clear paths for advancement
            </p>
          </div>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>🌟</div>
            <h3 style={{ color: "#7C40A9", fontSize: "20px", fontWeight: "700", marginBottom: "10px" }}>
              Work-Life Balance
            </h3>
            <p style={{ color: "#4a5568", fontSize: "14px", lineHeight: "1.6" }}>
              Flexible schedules and comprehensive benefits for your well-being
            </p>
          </div>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>🤝</div>
            <h3 style={{ color: "#7C40A9", fontSize: "20px", fontWeight: "700", marginBottom: "10px" }}>
              Collaborative Culture
            </h3>
            <p style={{ color: "#4a5568", fontSize: "14px", lineHeight: "1.6" }}>
              Join a diverse, inclusive team that values your unique perspective
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div style={{ marginBottom: "30px" }}>
        <h2 className={styles.pageTitle} style={{ textAlign: "center", marginBottom: "20px" }}>
          Find Your Perfect Role
        </h2>
        <p style={{ 
          textAlign: "center", 
          color: "#4a5568", 
          marginBottom: "30px",
          fontSize: "16px"
        }}>
          Search by job ID or browse all available positions below
        </p>
        <SearchForm onSearch={handleSearch as (id: string, type: "requisition" | "template") => void} />
      </div>

      {/* Search Results Info */}
      {searchResult && searchResult.data && (
        <div className={styles.searchInfo}>
          <p>
            Showing search result for position:{" "}
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

      {/* Open Positions Section */}
      <div style={{ marginTop: "40px" }}>
        <h2 className={styles.pageTitle} style={{ marginBottom: "30px" }}>
          Open Positions ({displayRequisitions.length})
        </h2>
        <div className={styles.fullLine} style={{ marginBottom: "30px" }}></div>

        {loading && <p className={styles.loading}>Loading available positions...</p>}

        {!loading && displayRequisitions.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "#faf5ff",
            borderRadius: "12px",
            border: "2px solid #9570DD"
          }}>
            <p style={{ fontSize: "18px", color: "#7C40A9", fontWeight: "600" }}>
              No open positions at the moment
            </p>
            <p style={{ marginTop: "10px", color: "#6b7280" }}>
              Check back soon for new opportunities!
            </p>
          </div>
        )}

        {displayRequisitions.map((req) => (
          <div
            key={req._id}
            className={`${styles.card} ${
              searchResult?.data?._id === req._id ? styles.highlight : ""
            }`}
            ref={
              searchResult?.data?._id === req._id ? searchResultRef : null
            }
            style={{
              marginBottom: "20px",
              position: "relative",
              transition: "all 0.3s ease"
            }}
          >
            {/* Job Header */}
            <div style={{ 
              borderBottom: "2px solid #9570DD", 
              paddingBottom: "15px", 
              marginBottom: "15px" 
            }}>
              <h3 style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#ffffff",
                marginBottom: "10px",
                fontFamily: "'Roboto', sans-serif"
              }}>
                {req.templateId?.title || "Position Title"}
              </h3>
              <div style={{ 
                display: "flex", 
                gap: "15px", 
                flexWrap: "wrap",
                alignItems: "center"
              }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "14px",
                  color: "#ffffff"
                }}>
                  📍 {req.location}
                </span>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "14px",
                  color: "#ffffff"
                }}>
                  💼 {req.openings} {req.openings === 1 ? 'Opening' : 'Openings'}
                </span>
                <span style={{
                  padding: "4px 12px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase"
                }}>
                  {req.publishStatus}
                </span>
              </div>
            </div>

            {/* Job Details */}
            <div style={{ marginBottom: "20px" }}>
              <p style={{ marginBottom: "8px", fontSize: "14px" }}>
                <strong>Requisition ID:</strong> {req.requisitionId}
              </p>
              <p style={{ marginBottom: "8px", fontSize: "14px" }}>
                <strong>Position ID:</strong> {req._id}
              </p>
              
              {req.templateId?.description && (
                <div style={{ 
                  marginTop: "15px", 
                  padding: "15px",
                  backgroundColor: "#9570DD",
                  borderRadius: "8px",
                  border: "2px solid #693699"
                }}>
                  <p style={{ 
                    fontSize: "14px", 
                    lineHeight: "1.6",
                    color: "#ffffff"
                  }}>
                    {req.templateId.description}
                  </p>
                </div>
              )}
            </div>

            {/* Apply Button */}
            <div className={styles.actions}>
              <Link 
                href="/recruitment/careers/applications/" 
                className={styles.createButton}
                style={{
                  fontSize: "16px",
                  padding: "14px 32px"
                }}
              >
                 Apply Now
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA Section */}
      {displayRequisitions.length > 0 && (
        <div style={{
          marginTop: "60px",
          padding: "40px",
          textAlign: "center",
          background: "linear-gradient(135deg, #693699 0%, #7C40A9 100%)",
          borderRadius: "12px",
          color: "#ffffff"
        }}>
          <h2 style={{
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "15px",
            fontFamily: "'Roboto', sans-serif"
          }}>
            Ready to Make an Impact?
          </h2>
          <p style={{
            fontSize: "18px",
            marginBottom: "25px",
            fontFamily: "'Roboto Condensed', sans-serif"
          }}>
            Take the next step in your career journey with us
          </p>
          <Link 
            href="/recruitment/careers/applications/" 
            className={styles.createButton}
            style={{
              fontSize: "18px",
              padding: "16px 40px",
              backgroundColor: "#ffffff",
              color: "#7C40A9",
              display: "inline-block"
            }}
          >
            Start Your Application
          </Link>
        </div>
      )}
    </div>
  );
}