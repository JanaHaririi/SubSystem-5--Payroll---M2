"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import toast from "react-hot-toast";

interface EmployeeProfile {
  _id: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  workEmail?: string;
  personalEmail?: string;
  mobilePhone?: string;
  homePhone?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    country?: string;
  };
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  nationalId?: string;
  dateOfHire?: string;
  status: string;
  profilePictureUrl?: string;
  primaryDepartmentId?: {
    _id: string;
    name: string;
  };
  primaryPositionId?: {
    _id: string;
    title: string;
  };
  payGradeId?: any;
  roles?: any[];
  biography?: string;
  lastAppraisalDate?: string;
  lastAppraisalScore?: number;
  lastAppraisalRatingLabel?: string;
  contractType?: string;
  workType?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  bankName?: string;
  bankAccountNumber?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editBioMode, setEditBioMode] = useState(false);
  const [biography, setBiography] = useState("");
  const [contactInfo, setContactInfo] = useState({
    mobilePhone: "",
    homePhone: "",
    personalEmail: "",
    address: {
      city: "",
      streetAddress: "",
      country: "",
    },
  });
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get("/employee-profile/me");
      setProfile(response.data);
      setBiography(response.data.biography || "");
      setContactInfo({
        mobilePhone: response.data.mobilePhone || "",
        homePhone: response.data.homePhone || "",
        personalEmail: response.data.personalEmail || "",
        address: {
          city: response.data.address?.city || "",
          streetAddress: response.data.address?.streetAddress || "",
          country: response.data.address?.country || "",
        },
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContactInfo = async () => {
    try {
      await axiosInstance.patch("/employee-profile/me/contact-info", contactInfo);
      toast.success("Contact information updated successfully! ✅", {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
      setEditMode(false);
      fetchProfile();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update contact information", {
        duration: 4000,
        icon: '❌',
      });
    }
  };

  const handleUpdateBiography = async () => {
    try {
      await axiosInstance.patch("/employee-profile/me/profile", { biography });
      toast.success("Biography updated successfully! 📝", {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
      setEditBioMode(false);
      fetchProfile();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update biography", {
        duration: 4000,
        icon: '❌',
      });
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePic) return;

    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append("file", profilePic);

      await axiosInstance.post("/employee-profile/me/profile-picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Profile picture uploaded successfully! 📸", {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
      setProfilePic(null);
      fetchProfile();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to upload profile picture", {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setUploadingPic(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  if (!profile) {
    return <div className="text-white">Profile not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 transition"
          >
            Edit Contact Info
          </button>
        )}
      </div>

      {/* Profile Picture Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
        <div className="flex items-center space-x-6">
          <div className="w-32 h-32 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
            {profile.profilePictureUrl ? (
              <img
                src={`http://localhost:4000/employee-profile/profile-picture/${profile.profilePictureUrl}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl text-neutral-600">
                {profile.firstName?.[0]}
                {profile.lastName?.[0]}
              </span>
            )}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
              className="block text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-black hover:file:bg-neutral-200"
            />
            {profilePic && (
              <button
                onClick={handleProfilePictureUpload}
                disabled={uploadingPic}
                className="mt-2 px-4 py-2 bg-white text-black rounded-md hover:bg-neutral-200 disabled:opacity-50"
              >
                {uploadingPic ? "Uploading..." : "Upload"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-400">Employee Number</label>
            <p className="text-white">{profile.employeeNumber}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Full Name</label>
            <p className="text-white">
              {profile.firstName} {profile.middleName} {profile.lastName}
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Date of Birth</label>
            <p className="text-white">
              {profile.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Gender</label>
            <p className="text-white">{profile.gender || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Marital Status</label>
            <p className="text-white">{profile.maritalStatus || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">National ID</label>
            <p className="text-white">{profile.nationalId || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Employment Information */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Employment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-400">Department</label>
            <p className="text-white">
              {profile.primaryDepartmentId?.name || "Not Assigned"}
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Position</label>
            <p className="text-white">
              {profile.primaryPositionId?.title || "Not Assigned"}
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Date of Hire</label>
            <p className="text-white">
              {profile.dateOfHire
                ? new Date(profile.dateOfHire).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Employment Status</label>
            <p className="text-white">
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  profile.status === "ACTIVE"
                    ? "bg-green-900 text-green-300"
                    : profile.status === "ON_LEAVE"
                    ? "bg-yellow-900 text-yellow-300"
                    : "bg-red-900 text-red-300"
                }`}
              >
                {profile.status}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Performance Appraisal */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Appraisal</h2>
        {profile.lastAppraisalDate ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-neutral-400">Last Appraisal Date</label>
              <p className="text-white">
                {new Date(profile.lastAppraisalDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Score</label>
              <p className="text-white text-2xl font-bold">
                {profile.lastAppraisalScore?.toFixed(2) || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Rating</label>
              <p className="text-white">
                <span className="inline-block px-3 py-1 rounded bg-blue-900 text-blue-300 font-medium">
                  {profile.lastAppraisalRatingLabel || "N/A"}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-neutral-400">No appraisal history available yet.</p>
        )}
      </div>

      {/* Biography */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Biography</h2>
          {!editBioMode && (
            <button
              onClick={() => setEditBioMode(true)}
              className="px-3 py-1 bg-neutral-800 text-white text-sm rounded hover:bg-neutral-700"
            >
              Edit
            </button>
          )}
        </div>
        {editBioMode ? (
          <div className="space-y-4">
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white min-h-[150px]"
              placeholder="Tell us about yourself..."
            />
            <div className="flex space-x-3">
              <button
                onClick={handleUpdateBiography}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditBioMode(false);
                  setBiography(profile.biography || "");
                }}
                className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-neutral-300 whitespace-pre-wrap">
            {profile.biography || "No biography added yet."}
          </p>
        )}
      </div>

      {/* Contact Information (Editable) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Personal Email</label>
              <input
                type="email"
                value={contactInfo.personalEmail}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, personalEmail: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Mobile Phone</label>
              <input
                type="tel"
                value={contactInfo.mobilePhone}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, mobilePhone: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Home Phone</label>
              <input
                type="tel"
                value={contactInfo.homePhone}
                onChange={(e) =>
                  setContactInfo({ ...contactInfo, homePhone: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 block mb-1">Street Address</label>
              <input
                type="text"
                value={contactInfo.address.streetAddress}
                onChange={(e) =>
                  setContactInfo({
                    ...contactInfo,
                    address: { ...contactInfo.address, streetAddress: e.target.value }
                  })
                }
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-neutral-400 block mb-1">City</label>
                <input
                  type="text"
                  value={contactInfo.address.city}
                  onChange={(e) =>
                    setContactInfo({
                      ...contactInfo,
                      address: { ...contactInfo.address, city: e.target.value }
                    })
                  }
                  className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-neutral-400 block mb-1">Country</label>
                <input
                  type="text"
                  value={contactInfo.address.country}
                  onChange={(e) =>
                    setContactInfo({
                      ...contactInfo,
                      address: { ...contactInfo.address, country: e.target.value }
                    })
                  }
                  className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleUpdateContactInfo}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-neutral-400">Work Email</label>
              <p className="text-white">{profile.workEmail || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Personal Email</label>
              <p className="text-white">{profile.personalEmail || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Mobile Phone</label>
              <p className="text-white">{profile.mobilePhone || "N/A"}</p>
            </div>
            <div>
              <label className="text-sm text-neutral-400">Home Phone</label>
              <p className="text-white">{profile.homePhone || "N/A"}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-neutral-400">Address</label>
              <p className="text-white">
                {profile.address?.streetAddress && (
                  <>
                    {profile.address.streetAddress}
                    {profile.address.city && `, ${profile.address.city}`}
                    {profile.address.country && `, ${profile.address.country}`}
                  </>
                )}
                {!profile.address?.streetAddress && "N/A"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Employment Information */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Employment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-400">Hire Date</label>
            <p className="text-white">
              {profile.dateOfHire
                ? new Date(profile.dateOfHire).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Status</label>
            <p className="text-white">{profile.status}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Contract Type</label>
            <p className="text-white">{profile.contractType || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Work Type</label>
            <p className="text-white">{profile.workType || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Contract Start Date</label>
            <p className="text-white">
              {profile.contractStartDate
                ? new Date(profile.contractStartDate).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Contract End Date</label>
            <p className="text-white">
              {profile.contractEndDate
                ? new Date(profile.contractEndDate).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Pay Grade</label>
            <p className="text-white">{profile.payGradeId?.name || profile.payGradeId || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">System Roles</label>
            <p className="text-white">
              {profile.roles && profile.roles.length > 0
                ? profile.roles.map((r: any) => r.roleName || r).join(", ")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Banking Information */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Banking Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-400">Bank Name</label>
            <p className="text-white">{profile.bankName || "N/A"}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-400">Bank Account Number</label>
            <p className="text-white">{profile.bankAccountNumber || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Request Change Link */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Need to Update Other Information?</h2>
        <p className="text-neutral-400 mb-4">
          To update critical information such as your name, national ID, or marital status,
          please submit a change request.
        </p>
        <a
          href="/profile/change-request"
          className="inline-block px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200"
        >
          Submit Change Request
        </a>
      </div>
    </div>
  );
}
