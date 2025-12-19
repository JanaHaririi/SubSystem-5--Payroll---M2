"use client";

import axios from "axios";
import { Router } from "express";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Toaster, { toast } from "react-hot-toast"

export default function SendNotificationPage() {
  const [to, setTo] = useState(""); // single user ID
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function sendNotif(e: React.FormEvent) {
    e.preventDefault(); // prevent page reload

    const payload = {
      to,    // send as string
      type,
      message,
    };

    try {
      await axios.post("http://localhost:4000/time-management/notification-log", payload, {
        withCredentials: true,
      });
      toast.success("Notification sent successfully!")
      setTo("");
      setType("");
      setMessage("");
      router.replace('/time-management/notifications')
    } catch (err) {
      console.error(err);
      toast.error("Failed to send notification");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="mb-6">
        <Link
          href="/time-management"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      <main className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Send Notification
        </h1>

        <form onSubmit={sendNotif} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-4">
          {/* To */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">To (user ID)</label>
            <input
              type="text"
              placeholder="Enter user ID"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full p-2  rounded dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <input
              type="text"
              placeholder="Notification type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2  rounded dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">Message</label>
            <textarea
              placeholder="Notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 rounded dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
