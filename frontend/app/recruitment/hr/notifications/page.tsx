// app/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from '@/app/recruitment/component/shared-hr-styles.module.css';
import axiosInstance from "@/app/utils/ApiClient";

type Notification = {
  _id: string;
  to: string;
  type: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNotifications();
    // Load read IDs from localStorage
    const savedReadIds = localStorage.getItem('readNotificationIds');
    if (savedReadIds) {
      setReadIds(new Set(JSON.parse(savedReadIds)));
    }
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/time-management/notification-log");
      const notifData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      setNotifications(notifData);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    const newReadIds = new Set(readIds);
    newReadIds.add(notificationId);
    setReadIds(newReadIds);
    localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(newReadIds)));
  };

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n._id));
    setReadIds(allIds);
    localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(allIds)));
  };

  const isRead = (notificationId: string) => readIds.has(notificationId);

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !isRead(n._id);
    if (filter === "read") return isRead(n._id);
    return true;
  });

  const unreadCount = notifications.filter(n => !isRead(n._id)).length;

  if (loading) {
    return <div className={styles.loading}>Loading notifications...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 className={styles.pageTitle} style={{ margin: 0, marginBottom: '0.5rem' }}>
            🔔 Notifications
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        <div className={styles.actions}>
          <button
            onClick={loadNotifications}
            className={styles.button}
          >
            🔄 Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={styles.createButton}
            >
               Mark All as Read
            </button>
          )}
        </div>
      </div>

      <div className={styles.fullLine}></div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {(['all', 'unread', 'read'] as const).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={filter === filterType ? styles.createButton : styles.button}
            style={{
              textTransform: 'capitalize',
              minWidth: '120px'
            }}
          >
            {filterType} {filterType === 'unread' && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#7C40A9',
          borderRadius: '12px',
          border: '2px solid #9570DD',
          color: '#ffffff'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📬</div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {notifications.length}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Notifications</div>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: '#7C40A9',
          borderRadius: '12px',
          border: '2px solid #9570DD',
          color: '#ffffff'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {unreadCount}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Unread</div>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: '#7C40A9',
          borderRadius: '12px',
          border: '2px solid #9570DD',
          color: '#ffffff'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {notifications.filter(n => isRead(n._id)).length}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Read</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBanner}>
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          backgroundColor: '#7C40A9',
          borderRadius: '12px',
          border: '2px solid #9570DD',
          color: '#ffffff'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🔔</div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
            {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
          </h3>
          <p style={{ opacity: 0.8 }}>
            {filter === 'all' ? "You'll see notifications here when you receive them" : `All notifications are ${filter === 'unread' ? 'read' : 'unread'}`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredNotifications.map((notification) => {
            const notificationIsRead = isRead(notification._id);
            
            return (
              <div
                key={notification._id}
                className={styles.card}
                style={{
                  cursor: 'pointer',
                  border: notificationIsRead
                    ? '2px solid #9570DD' 
                    : '3px solid #693699',
                  backgroundColor: notificationIsRead ? '#7C40A9' : '#9570DD',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => !notificationIsRead && markAsRead(notification._id)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      padding: '0.375rem 0.75rem',
                      backgroundColor: '#ffffff',
                      color: '#7C40A9',
                      borderRadius: '0.375rem',
                      textTransform: 'uppercase'
                    }}>
                      {notification.type}
                    </span>
                    {!notificationIsRead && (
                      <span style={{
                        fontSize: '0.625rem',
                        fontWeight: '700',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        borderRadius: '0.375rem'
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#ffffff', opacity: 0.9 }}>
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#ffffff', opacity: 0.9 }}>
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <p style={{
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: '#ffffff',
                  margin: 0,
                  marginBottom: '0.75rem'
                }}>
                  {notification.message}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#ffffff', opacity: 0.9 }}>
                    👤 Recipient: {notification.to}
                  </span>
                  {!notificationIsRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      className={styles.createButton}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#10b981',
                        border: 'none'
                      }}
                    >
                      ✓ Mark as Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}