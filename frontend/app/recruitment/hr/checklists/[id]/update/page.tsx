// app/offboarding/checklists/[id]/update/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";

type ChecklistItem = {
  department: string;
  status?: "pending" | "approved" | "rejected";
  comments?: string;
  updatedBy?: string;
  updatedAt?: string;
};

type EquipmentItem = {
  equipmentId?: string;
  name: string;
  returned?: boolean;
  condition?: string;
};

type ClearanceChecklist = {
  _id: string;
  terminationId: string;
  items?: ChecklistItem[];
  equipmentList?: EquipmentItem[];
  cardReturned?: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function UpdateChecklistPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ClearanceChecklist | null>(null);

  const [formData, setFormData] = useState({
    items: [] as ChecklistItem[],
    equipmentList: [] as EquipmentItem[],
    cardReturned: false
  });

  useEffect(() => {
    if (id) {
      loadChecklist();
    }
  }, [id]);

  const loadChecklist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/offboarding/checklists/${id}`);
      const data = response.data;
      setChecklist(data);
      
      setFormData({
        items: data.items || [],
        equipmentList: data.equipmentList || [],
        cardReturned: data.cardReturned || false
      });
    } catch (err: any) {
      console.error("Failed to load checklist:", err);
      setError(err.response?.data?.message || "Failed to load checklist");
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: keyof ChecklistItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { 
      ...updatedItems[index], 
      [field]: value,
      updatedAt: new Date().toISOString()
    };
    setFormData({ ...formData, items: updatedItems });
  };

  const handleEquipmentChange = (index: number, field: keyof EquipmentItem, value: any) => {
    const updatedEquipment = [...formData.equipmentList];
    updatedEquipment[index] = { ...updatedEquipment[index], [field]: value };
    setFormData({ ...formData, equipmentList: updatedEquipment });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { department: "", status: "pending", comments: "" }]
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleAddEquipment = () => {
    setFormData({
      ...formData,
      equipmentList: [...formData.equipmentList, { name: "", returned: false, condition: "" }]
    });
  };

  const handleRemoveEquipment = (index: number) => {
    setFormData({
      ...formData,
      equipmentList: formData.equipmentList.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    for (const item of formData.items) {
      if (!item.department) {
        setError("All checklist items must have a department");
        return;
      }
    }

    for (const equipment of formData.equipmentList) {
      if (!equipment.name) {
        setError("All equipment items must have a name");
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        items: formData.items,
        equipmentList: formData.equipmentList,
        cardReturned: formData.cardReturned
      };

      console.log('Updating checklist with payload:', JSON.stringify(payload, null, 2));

      await axiosInstance.patch(`/offboarding/checklists/${id}`, payload);

      alert('✅ Checklist updated successfully!');
      router.push("/recruitment/offboarding/checklists");
    } catch (err: any) {
      console.error('Error updating checklist:', err);
      setError(err.response?.data?.message || "Failed to update checklist");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      case "pending":
      default:
        return "#f59e0b";
    }
  };

  const getCompletionPercentage = () => {
    if (formData.items.length === 0) return 0;
    const completed = formData.items.filter(i => i.status === "approved").length;
    return Math.round((completed / formData.items.length) * 100);
  };

  if (loading) {
    return <div className={styles.loading}>Loading checklist...</div>;
  }

  if (error && !checklist) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBanner} style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ marginBottom: '10px', fontSize: '24px' }}>Error Loading Checklist</h2>
          <p style={{ marginBottom: '30px' }}>{error}</p>
          <button
            onClick={() => router.push("/recruitment/offboarding/checklists")}
            className={styles.button}
          >
            ← Back to Checklists
          </button>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => router.push("/recruitment/offboarding/checklists")}
          className={styles.button}
          style={{ marginBottom: '20px' }}
        >
          ← Back to Checklists
        </button>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 className={styles.pageTitle} style={{ margin: '0 0 10px 0' }}>
              Update Clearance Checklist
            </h1>
            <p style={{ color: '#ffffff', fontSize: '14px', margin: 0, opacity: 0.8 }}>
              Checklist ID: {checklist?._id} | Termination ID: {checklist?.terminationId}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className={styles.card} style={{ 
            padding: '20px 30px', 
            textAlign: 'center',
            minWidth: '150px'
          }}>
            <div style={{ fontSize: '12px', marginBottom: '8px', opacity: 0.8 }}>
              Progress
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
              {completionPercentage}%
            </div>
          </div>
        </div>

        <div className={styles.fullLine}></div>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Progress Bar */}
        <div className={styles.card} style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '700' }}>
              Overall Completion
            </span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
              {formData.items.filter(i => i.status === "approved").length} / {formData.items.length} approved
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            background: '#9570DD',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '2px solid #693699'
          }}>
            <div style={{
              width: `${completionPercentage}%`,
              height: '100%',
              background: completionPercentage === 100 ? '#10b981' : '#3b82f6',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Department Clearances */}
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
            {formData.items.map((item, index) => (
              <div key={index} style={{
                padding: '20px',
                backgroundColor: '#9570DD',
                borderRadius: '8px',
                border: `3px solid ${getStatusColor(item.status)}`
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
                  {formData.items.length > 1 && (
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
                      Department Name <span style={{ color: '#b30000ff' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={item.department}
                      onChange={(e) => handleItemChange(index, "department", e.target.value)}
                      placeholder="e.g., IT, HR, Finance, Facilities"
                      required
                      className={styles.input}
                      style={{ width: '100%', paddingLeft: '16px', backgroundImage: 'none', color: '#1e293b' }}
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
                        value={item.status || "pending"}
                        onChange={(e) => handleItemChange(index, "status", e.target.value)}
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
                        value={item.comments || ""}
                        onChange={(e) => handleItemChange(index, "comments", e.target.value)}
                        placeholder="Add notes or requirements"
                        className={styles.input}
                        style={{ width: '100%', paddingLeft: '16px', backgroundImage: 'none', color: '#1e293b' }}
                      />
                    </div>
                  </div>

                  {item.updatedAt && (
                    <div style={{
                      padding: '12px',
                      background: '#693699',
                      borderRadius: '6px',
                      fontSize: '13px',
                      opacity: 0.9
                    }}>
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <span>🕒 Last updated: {new Date(item.updatedAt).toLocaleString()}</span>
                        {item.updatedBy && <span>👤 By: {item.updatedBy}</span>}
                      </div>
                    </div>
                  )}
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
            {formData.equipmentList.map((equipment, index) => (
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
                  {formData.equipmentList.length > 1 && (
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
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
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
                        Equipment Name <span style={{ color: '#f87171' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={equipment.name}
                        onChange={(e) => handleEquipmentChange(index, "name", e.target.value)}
                        placeholder="e.g., Laptop, Access Card, Phone"
                        required
                        className={styles.input}
                        style={{ width: '100%', paddingLeft: '16px', backgroundImage: 'none', color: '#1e293b' }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '700',
                        marginBottom: '8px'
                      }}>
                        Equipment ID
                      </label>
                      <input
                        type="text"
                        value={equipment.equipmentId || ""}
                        onChange={(e) => handleEquipmentChange(index, "equipmentId", e.target.value)}
                        placeholder="Optional ID"
                        className={styles.input}
                        style={{ width: '100%', paddingLeft: '16px', backgroundImage: 'none', color: '#1e293b' }}
                      />
                    </div>
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
                        checked={equipment.returned || false}
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
                        value={equipment.condition || ""}
                        onChange={(e) => handleEquipmentChange(index, "condition", e.target.value)}
                        placeholder="Good, Fair, Damaged"
                        className={styles.input}
                        style={{ width: '100%', paddingLeft: '16px', backgroundImage: 'none', color: '#1e293b' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access Card */}
        <div className={styles.card} style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            🎫 Access Card Status
          </h2>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            padding: '20px',
            backgroundColor: formData.cardReturned ? '#10b981' : '#f59e0b',
            borderRadius: '8px',
            border: formData.cardReturned ? '2px solid #059669' : '2px solid #d97706',
            transition: 'all 0.2s'
          }}>
            <input
              type="checkbox"
              checked={formData.cardReturned}
              onChange={(e) => setFormData({ ...formData, cardReturned: e.target.checked })}
              style={{
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                accentColor: '#7C40A9'
              }}
            />
            <div>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '4px'
              }}>
                {formData.cardReturned ? '✅ Access Card Returned' : '⏳ Access Card Not Returned'}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>
                Mark this when the employee has returned their access card
              </div>
            </div>
          </label>
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
            disabled={saving}
            className={styles.createButton}
            style={{ 
              flex: 1,
              opacity: saving ? 0.6 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
              backgroundColor: saving ? '#94a3b8' : '#10b981'
            }}
          >
            {saving ? '⏳ Saving Changes...' : '✅ Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push("/recruitment/offboarding/checklists")}
            disabled={saving}
            className={styles.button}
            style={{ 
              flex: 1,
              opacity: saving ? 0.6 : 1,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}