import axiosInstance from './ApiClient';

export type InsuranceBracket = {
  _id?: string;
  name: string;
  amount: number;
  status: 'draft' | 'approved' | 'rejected';
  minSalary: number;
  maxSalary: number;
  employeeRate: number;
  employerRate: number;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateInsuranceBracketPayload = {
  name: string;
  amount: number;
  status: 'draft' | 'approved' | 'rejected';
  minSalary: number;
  maxSalary: number;
  EmployeeRate: number;
  EmployerRate: number;
};

export type EditInsuranceBracketPayload = {
  name?: string;
  amount?: number;
  status?: 'draft' | 'approved' | 'rejected';
  minSalary?: number;
  maxSalary?: number;
  EmployeeRate?: number;
  EmployerRate?: number;
};

// HR Manager endpoints
export const getAllInsuranceBracketsForHR = async (): Promise<InsuranceBracket[]> => {
  const res = await axiosInstance.get('/payroll-configuration/hr-manager/insurance-brackets');
  return res.data;
};

export const getInsuranceBracketByIdForHR = async (id: string): Promise<InsuranceBracket> => {
  const res = await axiosInstance.get(`/payroll-configuration/hr-manager/insurance-brackets/${id}`);
  return res.data;
};

export const approveInsuranceBracket = async (id: string) => {
  const res = await axiosInstance.post(`/payroll-configuration/approve/insurance/${id}`);
  return res.data;
};

export const rejectInsuranceBracket = async (id: string) => {
  const res = await axiosInstance.post(`/payroll-configuration/reject/insurance/${id}`);
  return res.data;
};

