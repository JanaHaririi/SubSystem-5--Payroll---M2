"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/utils/ApiClient";
import { FaUser, FaUserTie, FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();

  const [loginType, setLoginType] = useState<"employee" | "candidate">("employee");
  const [identifier, setIdentifier] = useState("");
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

      // 🔁 Redirect based on login type
      if (loginType === "candidate") {
        router.push("/recruitment/candidate/dashboard");
      } else {
        router.push("/home");
      }

    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl shadow-2xl border border-gray-800 mb-4">
            <FaSignInAlt className="text-3xl text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in to access your account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gradient-to-b from-gray-900 to-black backdrop-blur-sm border border-gray-800 shadow-2xl rounded-2xl overflow-hidden">
          {/* Glass effect header */}
          <div className="border-b border-gray-800 bg-gradient-to-r from-gray-900/50 to-black/50 p-6">
            <div className="flex gap-2 bg-black/60 rounded-xl p-1 border border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setLoginType("employee");
                  setIdentifier("");
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  loginType === "employee"
                    ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-900/50"
                }`}
              >
                <FaUserTie className={loginType === "employee" ? "text-blue-400" : ""} />
                Employee
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType("candidate");
                  setIdentifier("");
                }}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  loginType === "candidate"
                    ? "bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-900/50"
                }`}
              >
                <FaUser className={loginType === "candidate" ? "text-blue-400" : ""} />
                Candidate
              </button>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Identifier Input */}
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <FaEnvelope className="text-gray-500" />
                  {loginType === "employee" ? "Employee Number" : "Email Address"}
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl blur-sm group-hover:blur transition-all duration-300"></div>
                  <input
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    type={loginType === "employee" ? "text" : "email"}
                    required
                    className="relative w-full rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 pl-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600 transition-all duration-300"
                    placeholder={loginType === "employee" ? "EMP12345" : "you@example.com"}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {loginType === "employee" ? "#" : "@"}
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <FaLock className="text-gray-500" />
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl blur-sm group-hover:blur transition-all duration-300"></div>
                  <input
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                    className="relative w-full rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 pl-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-gray-600 transition-all duration-300"
                    placeholder="Enter your password"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FaLock />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl border border-red-800/50 bg-gradient-to-r from-red-950/40 to-red-900/20 px-4 py-3 flex items-center gap-3 animate-pulse">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold py-3.5 px-4 transition-all duration-300 hover:from-gray-700 hover:to-gray-800 hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700/0 via-gray-600/20 to-gray-700/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <FaSignInAlt />
                      Sign In
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Register Link for Candidates */}
            {loginType === "candidate" && (
              <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                <p className="text-gray-400 text-sm">
                  New to our platform?{" "}
                  <Link
                    href="/register"
                    className="text-white font-medium hover:text-gray-300 transition-colors duration-300 relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-px after:bg-white after:transition-all after:duration-300 hover:after:w-full"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            )}

            {/* Footer Note */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-800/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-800/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}