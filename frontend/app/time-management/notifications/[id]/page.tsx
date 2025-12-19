"use client";

import { use } from "react"; // unwrap promise
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface Notification {
  _id: string;
  type: string;
  message: string;
}

export default function NotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [notif, setNotif] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );

  if (!notif)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-red-500 dark:text-red-400">Notification not found.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <main className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/time-management/notifications"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            &larr; Back to Notifications
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{notif.type}</h1>
          <p className="text-gray-700 dark:text-gray-300 text-lg">{notif.message}</p>
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">ID: {notif._id}</p>
        </div>
      </main>
    </div>
  );
}
