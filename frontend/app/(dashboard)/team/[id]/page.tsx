"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axiosInstance from "@/app/utils/ApiClient";

interface TeamMemberProfile {
  _id: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  hireDate?: string;
  status: string;
  profilePictureUrl?: string;
  departmentId?: string;
  positionId?: string;
  payGrade?: string;
}

export default function TeamMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<TeamMemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberProfile();
  }, [params.id]);

  const fetchMemberProfile = async () => {
    try {
      const response = await axiosInstance.get(`/employee-profile/team/${params.id}`);
      setMember(response.data);
    } catch (error) {
      console.error("Error fetching team member profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  if (!member) {
    return <div className="text-white">Team member not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push("/team")}
          className="text-neutral-400 hover:text-white"
        >
          ← Back to Team
        </button>
      </div>

      <div className="flex items-center space-x-6">
        <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
          {member.profilePictureUrl ? (
            <img
              src={`http://localhost:4000/employee-profile/profile-picture/${member.profilePictureUrl}`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl text-neutral-600">
              {member.firstName?.[0]}
              {member.lastName?.[0]}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">
            {member.firstName} {member.middleName} {member.lastName}
          </h1>
          <p className="text-neutral-400">{member.employeeNumber}</p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-400">Email</label>
            <p className="text-white">{member.email}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Phone</label>
            <p className="text-white">{member.phone || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Gender</label>
            <p className="text-white">{member.gender || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Date of Birth</label>
            <p className="text-white">
              {member.dateOfBirth
                ? new Date(member.dateOfBirth).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Employment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-400">Hire Date</label>
            <p className="text-white">
              {member.hireDate
                ? new Date(member.hireDate).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Status</label>
            <p className="text-white">{member.status}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Pay Grade</label>
            <p className="text-white">{member.payGrade || "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <p className="text-sm text-neutral-400">
          Note: Sensitive information such as salary, appraisal history, and personal
          identification details are not visible to managers for privacy compliance.
        </p>
      </div>
    </div>
  );
}
