"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/app/utils/ApiClient";
import { useAuth } from "@/app/(system)/context/authContext";
import { isManager } from "@/app/utils/roleCheck";

interface Position {
  _id: string;
  title: string;
  departmentId?: { _id: string; name: string };
  reportsToPositionId?: string;
  employeeName?: string;
  employeeNumber?: string;
}

interface Department {
  _id: string;
  name: string;
  headPositionId?: string;
}

export default function OrganizationHierarchyPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [headEmployee, setHeadEmployee] = useState<any>(null);
  const [colleagues, setColleagues] = useState<any[]>([]);
  const [reportsTo, setReportsTo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchHierarchy();
    }
  }, [user]);

  const fetchHierarchy = async () => {
    try {
      const isManagerUser = isManager(user);

      if (isManagerUser) {
        const res = await axiosInstance.get(
          "/organization-structure/hierarchy/organization"
        );
        setDepartments(res.data.departments || []);
        setPositions(res.data.positions || []);
        setEmployees(res.data.employees || []);
      } else {
        const res = await axiosInstance.get(
          "/organization-structure/hierarchy/my-structure"
        );

        if (res.data.employee) setEmployees([res.data.employee]);
        if (res.data.position) setPositions([res.data.position]);
        if (res.data.department) setDepartments([res.data.department]);
        if (res.data.headEmployee) setHeadEmployee(res.data.headEmployee);
        if (res.data.colleagues) setColleagues(res.data.colleagues);
        if (res.data.reportsTo) setReportsTo(res.data.reportsTo);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load organization hierarchy");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FULL ORG (MANAGER / HR) ================= */

  const renderFullOrgChart = () => {
    if (departments.length === 0) {
      return <p className="text-center text-gray-500">No departments found.</p>;
    }

    return (
      <div className="space-y-12">
        {departments.map((dept) => {
          const deptPositions = positions.filter(
            (pos) => pos.departmentId?._id === dept._id
          );

          // Debug logging for IT Department
          if (dept.name === "IT Department" || dept.name?.includes("IT")) {
            console.log("🔍 IT Department:", dept);
            console.log("  - headPositionId:", dept.headPositionId);
            console.log("  - All positions in dept:", deptPositions.map(p => ({ id: p._id, title: p.title })));
          }

          const headPosition = deptPositions.find(
            (pos) => pos._id.toString() === dept.headPositionId?.toString()
          );

          // Debug logging
          if (dept.name === "IT Department" || dept.name?.includes("IT")) {
            console.log("  - Head position found:", headPosition?.title || "NOT FOUND");
            console.log("  - Comparing:", {
              lookingFor: dept.headPositionId?.toString(),
              positionIds: deptPositions.map(p => p._id.toString())
            });
          }

          const subordinatePositions = deptPositions.filter(
            (pos) => pos._id.toString() !== dept.headPositionId?.toString()
          );

          const getEmployeeForPosition = (posId: string) =>
            employees.find((emp) => {
              const empPosId =
                emp.primaryPositionId?._id || emp.primaryPositionId;
              return empPosId?.toString() === posId?.toString();
            });

          return (
            <div key={dept._id} className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg">
              <h2 className="text-2xl font-bold text-center mb-8">
                📁 {dept.name}
              </h2>

              {headPosition && (
                <div className="flex flex-col items-center mb-10">
                  <div className="bg-blue-600 text-white p-6 rounded-lg min-w-[280px] relative">
                    <div className="text-center">
                      <h3 className="font-bold text-lg">
                        {headPosition.title}
                      </h3>
                      {getEmployeeForPosition(headPosition._id) && (
                        <>
                          <p className="text-sm">
                            {getEmployeeForPosition(headPosition._id)?.firstName}{" "}
                            {getEmployeeForPosition(headPosition._id)?.lastName}
                          </p>
                          <p className="text-xs opacity-80">
                            {
                              getEmployeeForPosition(headPosition._id)
                                ?.employeeNumber
                            }
                          </p>
                        </>
                      )}
                      <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 text-xs rounded-full font-bold">
                        HEAD
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {subordinatePositions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {subordinatePositions.map((pos) => {
                    const emp = getEmployeeForPosition(pos._id);
                    return (
                      <div
                        key={pos._id}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center"
                      >
                        <h4 className="font-semibold">{pos.title}</h4>
                        {emp ? (
                          <>
                            <p className="text-sm">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {emp.employeeNumber}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm italic text-gray-500">
                            Vacant
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ================= EMPLOYEE VIEW (RESTRICTED) ================= */

  const renderEmployeeView = () => {
  if (
    employees.length === 0 ||
    positions.length === 0 ||
    departments.length === 0
  ) {
    return <p className="text-center text-gray-500">No data available.</p>;
  }

  const employee = employees[0];
  const position = positions[0];
  const department = departments[0];

  // 🔑 Check if we have a head employee (from API response)
  const hasHead = Boolean(headEmployee && reportsTo);

  // Check if current employee IS the head
  const isEmployeeTheHead = headEmployee && employee._id === headEmployee._id;

  return (
    <div className="flex flex-col items-center space-y-10">
      {/* Department */}
      <h2 className="text-2xl font-bold">📁 {department.name}</h2>

      {/* Department Head - Only show if employee is NOT the head */}
      {hasHead && !isEmployeeTheHead && (
        <>
          <div className="bg-blue-600 text-white p-6 rounded-lg min-w-[280px] text-center relative">
            <h3 className="font-bold mb-1">
              {reportsTo?.title || "Department Head"}
            </h3>
            <p className="text-sm">
              {headEmployee.firstName} {headEmployee.lastName}
            </p>
            <p className="text-xs italic opacity-80">
              {headEmployee.employeeNumber}
            </p>

            <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 text-xs rounded-full font-bold">
              HEAD
            </span>
          </div>
          {/* Connection Line */}
          <div className="w-0.5 h-10 bg-gray-400"></div>
        </>
      )}

      {/* Logged-in Employee */}
      <div className={`p-6 rounded-lg text-center min-w-[280px] relative ${
        isEmployeeTheHead
          ? 'bg-blue-600 text-white'
          : 'bg-white dark:bg-gray-800 border-2 border-green-500'
      }`}>
        <h4 className="font-semibold text-lg">{position.title}</h4>
        <p className="text-sm">
          {employee.firstName} {employee.lastName} <span className={`font-bold ${isEmployeeTheHead ? 'text-yellow-300' : 'text-green-600'}`}>(You)</span>
        </p>
        <p className={`text-xs ${isEmployeeTheHead ? 'opacity-80' : 'text-gray-500'}`}>
          {employee.employeeNumber}
        </p>
        {isEmployeeTheHead && (
          <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 text-xs rounded-full font-bold">
            HEAD
          </span>
        )}
      </div>

      {/* Colleagues - Show horizontally next to employee */}
      {colleagues && colleagues.length > 0 && (
        <div className="w-full">
          <h3 className="font-semibold text-lg mb-4 text-center">Your Colleagues</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {colleagues.map((colleague: any) => (
              <div key={colleague._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center min-w-[200px] max-w-[250px]">
                <h4 className="font-semibold">{colleague.primaryPositionId?.title || "Position"}</h4>
                <p className="text-sm">
                  {colleague.firstName} {colleague.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {colleague.employeeNumber}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading organization hierarchy...
      </div>
    );
  }

  const isManagerUser = isManager(user);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Organization Hierarchy Chart
      </h1>

      {error && (
        <p className="text-red-600 text-center mb-4">{error}</p>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {isManagerUser ? renderFullOrgChart() : renderEmployeeView()}
      </div>
    </div>
  );
}
