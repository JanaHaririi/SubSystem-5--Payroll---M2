// app/offboarding/checklists/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";

type TerminationRequest = {
  _id: string;
  employeeId: string;
  status: string;
  reason: string;
};

type ChecklistItem = {
  department: string;
  status: "pending" | "approved" | "rejected";
  comments: string;
};

type EquipmentItem = {
  name: string;
  returned: boolean;
  condition: string;
};

export default function CreateChecklistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminationRequests, setTerminationRequests] = useState<TerminationRequest[]>([]);
  
  const [formData, setFormData] = useState({
    terminationId: "",
    cardReturned: false
  });

  const [items, setItems] = useState<ChecklistItem[]>([
    { department: "IT", status: "pending", comments: "Return laptop, access cards, and all IT equipment" },
    { department: "HR", status: "pending", comments: "Complete exit interview and submit required documents" },
    { department: "Finance", status: "pending", comments: "Clear all outstanding expenses and return company credit card" },
    { department: "Facilities", status: "pending", comments: "Return office keys, parking pass, and clear workspace" }
  ]);

  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([
    { name: "Laptop", returned: false, condition: "" },
    { name: "Access Card", returned: false, condition: "" }
  ]);

  useEffect(() => {
    loadTerminationRequests();
  }, []);

  const loadTerminationRequests = async () => {
    try {
      const response = await axiosInstance.get("/offboarding/requests");
      const approved = (response.data || []).filter(
        (req: TerminationRequest) => req.status === "APPROVED" || req.status === "approved"
      );
      setTerminationRequests(approved);
    } catch (err) {
      console.error("Failed to load termination requests:", err);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { department: "", status: "pending", comments: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ChecklistItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleAddEquipment = () => {
    setEquipmentList([...equipmentList, { name: "", returned: false, condition: "" }]);
  };

  const handleRemoveEquipment = (index: number) => {
    setEquipmentList(equipmentList.filter((_, i) => i !== index));
  };

  const handleEquipmentChange = (index: number, field: keyof EquipmentItem, value: any) => {
    const updatedEquipment = [...equipmentList];
    updatedEquipment[index] = { ...updatedEquipment[index], [field]: value };
    setEquipmentList(updatedEquipment);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.terminationId) {
      setError("Please select a termination request");
      return;
    }

    for (const item of items) {
      if (!item.department) {
        setError("All checklist items must have a department");
        return;
      }
    }

    for (const equipment of equipmentList) {
      if (!equipment.name) {
        setError("All equipment items must have a name");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        terminationId: formData.terminationId,
        items: items,
        equipmentList: equipmentList,
        cardReturned: formData.cardReturned
      };

      console.log('Creating checklist with payload:', JSON.stringify(payload, null, 2));

      await axiosInstance.post("/offboarding/checklists", payload);

      alert('Clearance checklist created successfully!');
      router.push("/recruitment/offboarding/checklists");
    } catch (err: any) {
      console.error('Error creating checklist:', err);
      setError(err.response?.data?.message || "Failed to create checklist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => router.back()}
          className={styles.button}
          style={{ marginBottom: '20px' }}
        >
          ← Back to Checklists
        </button>

        <h1 className={styles.pageTitle}>Create Clearance Checklist</h1>
        <div className={styles.fullLine}></div>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Basic Information Card */}
        <div className={styles.card} style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            📋 Basic Information
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '8px'
            }}>
              Termination Request <span style={{ color: '#f87171' }}>*</span>
            </label>
            <select
              value={formData.terminationId}
              onChange={(e) => setFormData({ ...formData, terminationId: e.target.value })}
              required
              className={styles.select}
              style={{ width: '100%' }}
            >
              <option value="">Select approved termination request</option>
              {terminationRequests.map((req) => (
                <option key={req._id} value={req._id}>
                  Employee: {req.employeeId} | Status: {req.status}
                </option>
              ))}
            </select>
            {terminationRequests.length === 0 && (
              <small style={{ color: '#e9d5ff', display: 'block', marginTop: '8px' }}>
                ⚠️ No approved termination requests found
              </small>
            )}
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            padding: '16px',
            backgroundColor: '#693699',
            borderRadius: '8px',
            border: '2px solid #9570DD'
          }}>
            <input
              type="checkbox"
              checked={formData.cardReturned}
              onChange={(e) => setFormData({ ...formData, cardReturned: e.target.checked })}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                accentColor: '#7C40A9'
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              🎫 Access Card Returned
            </span>
          </label>
        </div>

        {/* Department Clearance Items */}
        <div className={styles.card} style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: 0
            }}>
              🏢 Department Clearances
            </h2>
            <button
              type="button"
              onClick={handleAddItem}
              className={styles.createButton}
            >
              + Add Department
            </button>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {items.map((item, index) => (
              <div key={index} style={{
                padding: '20px',
                backgroundColor: '#9570DD',
                borderRadius: '8px',
                border: '2px solid #693699'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#ffffff'
                  }}>
                    Department {index + 1}
                  </h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className={styles.deleteBtn}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '700',
                      marginBottom: '8px'
                    }}>
                      Department Name <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={item.department}
                      onChange={(e) => handleItemChange(index, "department", e.target.value)}
                      placeholder="e.g., IT, HR, Finance, Facilities"
                      required
                      className={styles.input}
                      style={{ width: '100%', paddingLeft: '16px', backgroundImage: 'none' }}
                    />
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '200px 1fr', 
                    gap: '16px',
                    alignItems: 'start'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '700',
                        marginBottom: '8px'
                      }}>
                        Status
                      </label>
                      <select
                        value={item.status}
                        onChange={(e) => handleItemChange(index, "status", e.target.value as any)}
                        className={styles.select}
                        style={{ width: '100%' }}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="approved">✅ Approved</option>
                        <option value="rejected">❌ Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '700',
                        marginBottom: '8px'
                      }}>
                        Comments
                      </label>
                      <input
                        type="text"
                        value={item.comments}
                        onChange={(e) => handleItemChange(index, "comments", e.target.value)}
                        placeholder="Requirements and instructions"
                        className={styles.input}
                        style={{ width: '100%', paddingLeft: '16px', backgroundImage: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment List */}
        <div className={styles.card} style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              margin: 0
            }}>
              💼 Equipment to Return
            </h2>
            <button
              type="button"
              onClick={handleAddEquipment}
              className={styles.createButton}
            >
              + Add Equipment
            </button>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {equipmentList.map((equipment, index) => (
              <div key={index} style={{
                padding: '20px',
                backgroundColor: '#9570DD',
                borderRadius: '8px',
                border: '2px solid #693699'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#ffffff'
                  }}>
                    Equipment {index + 1}
                  </h3>
                  {equipmentList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEquipment(index)}
                      className={styles.deleteBtn}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '700',
                      marginBottom: '8px'
                    }}>
                      Equipment Name <span style={{ color: '#f87171' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={equipment.name}
                      onChange={(e) => handleEquipmentChange(index, "name", e.target.value)}
                      placeholder="e.g., Laptop, Access Card, Phone"
                      required
                      className={styles.input}
                      style={{ width: '100%', paddingLeft: '16px', backgroundImage: 'none' }}
                    />
                  </div>

                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'auto 1fr', 
                    gap: '16px',
                    alignItems: 'start'
                  }}>
                    <label style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '12px',
                      backgroundColor: '#693699',
                      borderRadius: '8px',
                      border: '2px solid #7C40A9',
                      minWidth: '100px'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>Returned</span>
                      <input
                        type="checkbox"
                        checked={equipment.returned}
                        onChange={(e) => handleEquipmentChange(index, "returned", e.target.checked)}
                        style={{
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          accentColor: '#7C40A9'
                        }}
                      />
                    </label>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '700',
                        marginBottom: '8px'
                      }}>
                        Condition
                      </label>
                      <input
                        type="text"
                        value={equipment.condition}
                        onChange={(e) => handleEquipmentChange(index, "condition", e.target.value)}
                        placeholder="Good, Fair, Damaged"
                        className={styles.input}
                        style={{ width: '100%', paddingLeft: '16px', backgroundImage: 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorBanner} style={{ marginBottom: '24px' }}>
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            type="submit"
            disabled={loading}
            className={styles.createButton}
            style={{ 
              flex: 1,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Creating...' : '✅ Create Checklist'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className={styles.button}
            style={{ 
              flex: 1,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}