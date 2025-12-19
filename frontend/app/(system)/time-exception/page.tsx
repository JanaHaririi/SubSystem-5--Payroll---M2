"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useAuth } from "@/app/(system)/context/authContext";

type TimeException = {
  id: string;
  type: string;
  date: string;
  duration: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt?: string;
};

export default function TimeExceptionPage() {
  const { user } = useAuth();

  // --------------------
  // 1️⃣ STATE VARIABLES
  // --------------------
  const [myExceptions, setMyExceptions] = useState<TimeException[]>([]);
  const [pendingExceptions, setPending] = useState<TimeException[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [form, setForm] = useState({
    type: "",
    date: "",
    duration: "",
    reason: "",
  });

  // error handling
  const [error, setError] = useState("");

  // --------------------
  // 2️⃣ FETCH DATA
  // --------------------
  const fetchData = async () => {
    try {
      const me = await axiosInstance.get("/time-exception/my");
      setMyExceptions(me.data);

      if (user?.role === "Manager" || user?.role === "HR") {
        const pending = await axiosInstance.get("/time-exception/pending");
        setPending(pending.data);
      }
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --------------------
  // 3️⃣ CREATE
  // --------------------
  const handleCreate = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!form.type || !form.date || !form.duration) {
      setError("All fields are required.");
      return;
    }

    try {
      await axiosInstance.post("/time-exception/create", {
        ...form,
        duration: Number(form.duration),
      });

      setForm({ type: "", date: "", duration: "", reason: "" });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  // --------------------
  // 4️⃣ APPROVE
  // --------------------
  const approve = async (id: string) => {
    await axiosInstance.post(`/time-exception/${id}/approve`);
    fetchData();
  };

  // --------------------
  // 5️⃣ REJECT
  // --------------------
  const reject = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;

    await axiosInstance.post(`/time-exception/${id}/reject`, { reason });
    fetchData();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>Time Exception Management</h1>

      {/* ---------------------------
          EMPLOYEE CREATE FORM
      ---------------------------- */}
      {user?.role === "Employee" && (
        <div style={{ marginTop: "30px" }}>
          <h2>Create Time Exception</h2>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <form onSubmit={handleCreate}>
            <input
              placeholder="Type (Early Leave, Overtime...)"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
            <br />

            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <br />

            <input
              type="number"
              placeholder="Duration (hours)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
            <br />

            <textarea
              placeholder="Reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
            <br />

            <button type="submit">Submit</button>
          </form>
        </div>
      )}

      {/* ---------------------------
          MY EXCEPTIONS LIST
      ---------------------------- */}
      <div style={{ marginTop: "40px" }}>
        <h2>My Requests</h2>

        {myExceptions.length === 0 && <p>No requests submitted yet.</p>}

        {myExceptions.map((ex) => (
          <div key={ex.id} style={{ border: "1px solid #ddd", padding: 10, marginTop: 10 }}>
            <p><strong>Type:</strong> {ex.type}</p>
            <p><strong>Date:</strong> {ex.date}</p>
            <p><strong>Status:</strong> {ex.status}</p>
          </div>
        ))}
      </div>

      {/* ---------------------------
          MANAGER APPROVAL LIST
      ---------------------------- */}
      {(user?.role === "Manager" || user?.role === "HR") && (
        <div style={{ marginTop: "40px" }}>
          <h2>Pending Approvals</h2>

          {pendingExceptions.length === 0 && <p>No pending requests.</p>}

          {pendingExceptions.map((ex) => (
            <div key={ex.id} style={{ border: "1px solid #aaa", padding: 10, marginTop: 10 }}>
              <p><strong>Employee ID:</strong> {ex.id}</p>
              <p><strong>Type:</strong> {ex.type}</p>
              <p><strong>Date:</strong> {ex.date}</p>

              <button onClick={() => approve(ex.id)} style={{ marginRight: 10 }}>
                Approve
              </button>

              <button onClick={() => reject(ex.id)} style={{ background: "red", color: "white" }}>
                Reject
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
  