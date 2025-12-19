"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { FaArrowLeft, FaBell, FaCalendarAlt, FaClock, FaPaperPlane, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaEnvelope, FaShareSquare } from "react-icons/fa";

interface Notification {
  _id: string;
  type: string;
  message: string;
  createdAt?: string;
  actionable?: boolean;
  to?: string | { toString(): string };
  updatedAt?: string;
}

export default function NotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [notif, setNotif] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    (async () => {
      try {
        const res = await axios.get<{ message: string; data: Notification }>(
          `http://localhost:4000/time-management/notification-log/${id}`,
          { withCredentials: true }
        );
        setNotif(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const getNotificationIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('approval') || typeLower.includes('approved')) {
      return <FaCheckCircle className="text-emerald-500" />;
    } else if (typeLower.includes('warning') || typeLower.includes('alert') || typeLower.includes('escalat')) {
      return <FaExclamationTriangle className="text-amber-500" />;
    } else if (typeLower.includes('info') || typeLower.includes('information')) {
      return <FaInfoCircle className="text-blue-500" />;
    } else if (typeLower.includes('message') || typeLower.includes('email')) {
      return <FaEnvelope className="text-violet-500" />;
    } else {
      return <FaBell className="text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('approval') || typeLower.includes('approved')) {
      return 'bg-emerald-500';
    } else if (typeLower.includes('warning') || typeLower.includes('alert') || typeLower.includes('escalat')) {
      return 'bg-amber-500';
    } else if (typeLower.includes('info') || typeLower.includes('information')) {
      return 'bg-blue-500';
    } else if (typeLower.includes('message') || typeLower.includes('email')) {
      return 'bg-violet-500';
    } else {
      return 'bg-gray-500';
    }
  };

  const getTypeBgColor = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('approval') || typeLower.includes('approved')) {
      return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50';
    } else if (typeLower.includes('warning') || typeLower.includes('alert') || typeLower.includes('escalat')) {
      return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50';
    } else if (typeLower.includes('info') || typeLower.includes('information')) {
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50';
    } else if (typeLower.includes('message') || typeLower.includes('email')) {
      return 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/50';
    } else {
      return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50';
    }
  };

  const copyToClipboard = () => {
    if (!notif) return;
    const textToCopy = `${notif.type}\n\n${notif.message}\n\nID: ${notif._id}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-3 border-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-10 w-10 bg-blue-500/20 rounded-full animate-ping"></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">
            Loading notification details...
          </p>
        </div>
      </div>
    );
  }

  if (!notif) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <Link
                href="/time-management/notifications"
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 group"
              >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Notifications
              </Link>
            </div>
            
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 rounded-3xl mb-6 shadow-lg">
                <FaExclamationTriangle className="text-4xl text-rose-500 dark:text-rose-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                Notification Not Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                The notification you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link href="/time-management/notifications">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <FaBell />
                  View All Notifications
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
      <main className="max-w-5xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              href="/time-management/notifications"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 group"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Notifications
            </Link>
          </div>

          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-blue-900 dark:via-blue-800 dark:to-cyan-800 rounded-2xl p-6 md:p-8 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                    <div className="text-3xl text-white">
                      {getNotificationIcon(notif.type)}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                      Notification Details
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                        {notif.type}
                      </span>
                      {notif.actionable && (
                        <span className="px-4 py-1.5 bg-emerald-500/30 backdrop-blur-sm text-white rounded-full text-sm font-medium flex items-center gap-1.5">
                          <FaCheckCircle className="text-xs" />
                          Action Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all hover:scale-[1.02] backdrop-blur-sm shadow-lg hover:shadow-xl active:scale-[0.98]"
                  >
                    <FaShareSquare className="text-lg" />
                    {copied ? 'Copied!' : 'Share'}
                  </button>
                  <Link href="/time-management/notifications/send">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl active:scale-[0.98]">
                      <FaPaperPlane />
                      Send New
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Message Section */}
            <div className="p-6 md:p-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  <FaInfoCircle className="text-gray-500 dark:text-gray-400 text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Message Content
                </h2>
              </div>
              
              <div className={`p-6 rounded-xl ${getTypeBgColor(notif.type)}`}>
                <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
                  {notif.message}
                </p>
              </div>
            </div>

            {/* Details Section */}
            <div className="p-6 md:p-8">
              <div className="">
                {/* Notification Metadata */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FaInfoCircle className="text-gray-500 dark:text-gray-400" />
                      Notification Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Type</span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                          {notif.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Status</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${notif.actionable ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'}`}>
                          {notif.actionable ? 'Action Required' : 'Informational'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Notification ID</span>
                        <span className="font-mono text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                          {notif._id}
                        </span>
                      </div>
                      
                      {notif.to && (
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Recipient</span>
                          <span className="font-mono text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {typeof notif.to === 'object' ? notif.to.toString() : notif.to}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>  
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href="/time-management/notifications">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                <FaArrowLeft />
                Back to List
              </button>
            </Link>
            
            <Link href="/time-management/notifications/send">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl">
                <FaPaperPlane />
                Send New Notification
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}