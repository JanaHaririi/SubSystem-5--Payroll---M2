"use client";

import { useAuth } from "@/app/(system)/context/authContext";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaBell, FaArrowLeft, FaPaperPlane, FaClock, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaEnvelope, FaChevronRight } from "react-icons/fa";

export interface Notification {
  _id: string;
  type: string;
  message: string;
  createdAt?: string;
  isRead?: boolean;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function getUserNotifs() {
      try {
        const res = await axios.get<{ message: string; data: Notification[] }>(
          `http://localhost:4000/time-management/notification-log/employee/${user?.userid}`,
          { withCredentials: true }
        );
        setNotifications(res.data.data);
        console.log(res.data.data)
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    getUserNotifs();
  }, [user]);

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'approval':
      case 'approved':
        return <FaCheckCircle className="text-green-500" />;
      case 'warning':
      case 'alert':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'info':
      case 'information':
        return <FaInfoCircle className="text-blue-500" />;
      case 'message':
      case 'email':
        return <FaEnvelope className="text-purple-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-2xl mb-4 animate-pulse">
            <FaBell className="text-2xl text-gray-500 dark:text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <Link
                href="/time-management"
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 group"
              >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Dashboard
              </Link>
            </div>

            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-3xl mb-6 shadow-lg">
                <FaBell className="text-4xl text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No notifications yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                You're all caught up! Check back later for updates.
              </p>
              <Link href="./notifications/send">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <FaPaperPlane />
                  Send Notification
                </button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              href="/time-management"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 group"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Dashboard
            </Link>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FaBell className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Notifications
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            <Link href="./notifications/send">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <FaPaperPlane />
                Send Notification
              </button>
            </Link>
          </div>

          {/* Notification Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {notifications.map((notif) => (
              <NotificationCard
                key={notif._id}
                notification={notif}
                icon={getNotificationIcon(notif.type)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function NotificationCard({ notification, icon }: { notification: Notification; icon: React.ReactNode }) {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'approval':
      case 'approved':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50';
      case 'warning':
      case 'alert':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50';
      case 'info':
      case 'information':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50';
      case 'message':
      case 'email':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50';
      default:
        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50';
    }
  };

  const getTypeTextColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'approval':
      case 'approved':
        return 'text-green-700 dark:text-green-400';
      case 'warning':
      case 'alert':
        return 'text-yellow-700 dark:text-yellow-400';
      case 'info':
      case 'information':
        return 'text-blue-700 dark:text-blue-400';
      case 'message':
      case 'email':
        return 'text-purple-700 dark:text-purple-400';
      default:
        return 'text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <Link
      href={`./notifications/${notification._id}`}
      className={`group block border-2 ${getTypeColor(notification.type)} rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer relative overflow-hidden`}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/10 dark:from-gray-900/0 dark:via-gray-900/0 dark:to-gray-800/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}

      <div className="relative z-10">
        {/* Header with icon and type */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="text-xl">
                {icon}
              </div>
            </div>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeTextColor(notification.type)} bg-white/50 dark:bg-gray-800/50`}>
                {notification.type}
              </span>
            </div>
          </div>
          
          {/* Time indicator if available */}
          {notification.createdAt && (
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <FaClock className="text-xs" />
              <span>Now</span>
            </div>
          )}
        </div>

        {/* Notification message */}
        <div className="mb-4">
          <p className="text-gray-800 dark:text-gray-200 line-clamp-3">
            {notification.message}
          </p>
        </div>

        {/* Footer with view details */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            View details
          </span>
          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-300">
            <FaChevronRight className="text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}
