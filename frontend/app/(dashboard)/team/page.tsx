"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/app/utils/ApiClient";
import Link from "next/link";
import { isManager } from "@/app/utils/roleCheck";

interface TeamMember {
  _id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  positionId?: string;
  departmentId?: string;
  status: string;
  hireDate?: string;
  profilePictureUrl?: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const response = await axiosInstance.get("/employee-profile/me");

      // Use flexible role checking
      if (!isManager(response.data)) {
        alert("Access Denied: You don't have permission to access this page");
        router.push("/profile");
        return;
      }

      setHasAccess(true);
      fetchTeam();
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/profile");
    }
  };

  const fetchTeam = async () => {
    try {
      const response = await axiosInstance.get("/employee-profile/team");
      setTeam(response.data);
    } catch (error) {
      console.error("Error fetching team:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeam = team.filter(
    (member) =>
      member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">
          {loading ? "Loading..." : "Checking access..."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Team</h1>
        <p className="text-neutral-400">
          View and manage your direct reports
        </p>
      </div>

      {/* Search */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, employee number, or email..."
          className="w-full rounded-lg bg-black border border-neutral-700 px-4 py-2 text-white placeholder-neutral-500"
        />
      </div>

      {/* Team Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-sm text-neutral-400 mb-1">Total Team Members</h3>
          <p className="text-3xl font-bold text-white">{team.length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-sm text-neutral-400 mb-1">Active</h3>
          <p className="text-3xl font-bold text-green-400">
            {team.filter((m) => m.status === "ACTIVE").length}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-sm text-neutral-400 mb-1">Other Statuses</h3>
          <p className="text-3xl font-bold text-yellow-400">
            {team.filter((m) => m.status !== "ACTIVE").length}
          </p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Team Members</h2>
        {filteredTeam.length === 0 ? (
          <p className="text-neutral-400">No team members found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Employee #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Hire Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTeam.map((member) => (
                  <tr
                    key={member._id}
                    className="border-b border-neutral-800 hover:bg-neutral-800 transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden">
                          {member.profilePictureUrl ? (
                            <img
                              src={`http://localhost:4000/employee-profile/profile-picture/${member.profilePictureUrl}`}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm text-neutral-400">
                              {member.firstName?.[0]}
                              {member.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {member.firstName} {member.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-white">{member.employeeNumber}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-white text-sm">{member.email}</p>
                      {member.phone && (
                        <p className="text-neutral-400 text-xs">{member.phone}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-white text-sm">
                        {member.hireDate
                          ? new Date(member.hireDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          member.status === "ACTIVE"
                            ? "bg-green-900 text-green-300"
                            : "bg-yellow-900 text-yellow-300"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/team/${member._id}`}
                        className="text-white hover:text-neutral-300 text-sm underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
