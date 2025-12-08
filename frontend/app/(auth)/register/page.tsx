"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/utils/ApiClient";

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await axiosInstance.post(`/employee-profile/candidate/register`, {
        email,
        password,
        firstName,
        lastName,
        nationalId,
        phoneNumber: phoneNumber || undefined,
      });

      if (response.status === 200 || response.status === 201) {
        // Success - redirect to login
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl p-6 sm:p-8">
        {/* Title */}
        <h1 className="text-3xl font-semibold text-white text-center mb-2">
          Create an account
        </h1>
        <p className="text-center text-neutral-400 text-sm mb-6">
          Register as a job candidate
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* First Name */}
          <div className="space-y-1">
            <label className="text-sm text-neutral-300 block">First Name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="John"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <label className="text-sm text-neutral-300 block">Last Name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Doe"
            />
          </div>

          {/* National ID */}
          <div className="space-y-1">
            <label className="text-sm text-neutral-300 block">National ID</label>
            <input
              type="text"
              required
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="12345678901234"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="text-sm text-neutral-300 block">Phone Number (Optional)</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="+20 123 456 7890"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm text-neutral-300 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm text-neutral-300 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="••••••••"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-600 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white text-black font-semibold py-2 transition hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-5 text-center text-neutral-400 text-sm">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-white underline hover:text-neutral-300"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}