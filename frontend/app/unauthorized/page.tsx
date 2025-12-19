"use client";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Unauthorized</h1>
        <p className="text-gray-600">
          You don&apos;t have permission to view this page. Please log in with an authorized role.
        </p>
      </div>
    </div>
  );
}

