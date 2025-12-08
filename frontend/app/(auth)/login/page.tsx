"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/utils/ApiClient";

export default function LoginPage() {
  const router = useRouter();

  const [loginType, setLoginType] = useState<"employee" | "candidate">("employee");
  const [identifier, setIdentifier] = useState(""); // Employee number or email
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (loginType === "employee") {
        await axiosInstance.post("/auth/login", {
          employeeNumber: identifier,
          password,
        });
      } else {
        await axiosInstance.post("/auth/candidate-login", {
          email: identifier,
          password,
        });
      }
      router.push("/home");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl p-6 sm:p-8">

        {/* Title */}
        <h1 className="text-3xl font-semibold text-white text-center mb-2">
          Welcome back
        </h1>
        <p className="text-center text-neutral-400 text-sm mb-6">
          Login to continue
        </p>

        {/* Login Type Toggle */}
        <div className="flex gap-2 mb-6 bg-black rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setLoginType("employee");
              setIdentifier("");
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              loginType === "employee"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Employee
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType("candidate");
              setIdentifier("");
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              loginType === "candidate"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Candidate
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Identifier (Employee Number or Email) */}
          <div className="space-y-1">
            <label
              htmlFor="identifier"
              className="text-sm text-neutral-300 block"
            >
              {loginType === "employee" ? "Employee Number" : "Email"}
            </label>
            <input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              type={loginType === "employee" ? "text" : "email"}
              required
              className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
              placeholder={loginType === "employee" ? "EMP12345" : "you@example.com"}
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-sm text-neutral-300 block"
            >
              Password
            </label>
            <input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white"
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        {loginType === "candidate" && (
          <p className="mt-5 text-center text-neutral-400 text-sm">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-white underline hover:text-neutral-300"
            >
              Register
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
