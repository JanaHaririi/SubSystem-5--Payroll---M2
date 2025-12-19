"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";

export default function DebugAuth() {
  const [authInfo, setAuthInfo] = useState<any>(null);

  useEffect(() => {
    // Test the endpoint directly
    const testAuth = async () => {
      try {
        const res = await axiosInstance.get("/organization-structure/change-requests");
        console.log("✅ SUCCESS:", res.data);
        setAuthInfo({ success: true, data: res.data });
      } catch (err: any) {
        console.error("❌ ERROR:", err);
        console.error("Status:", err.response?.status);
        console.error("Message:", err.response?.data);
        setAuthInfo({
          success: false,
          status: err.response?.status,
          message: err.response?.data?.message || err.message,
          error: err.response?.data
        });
      }
    };

    testAuth();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1>Auth Debug Page</h1>
      <pre>{JSON.stringify(authInfo, null, 2)}</pre>
    </div>
  );
}
