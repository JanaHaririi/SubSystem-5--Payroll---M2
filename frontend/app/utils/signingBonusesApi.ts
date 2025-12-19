import axiosInstance from './ApiClient';

export type SigningBonus = {
  _id?: string;
  positionName: string;
  amount: number;
  status: 'draft' | 'approved' | 'rejected';
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSigningBonusPayload = {
  positionName: string;
  amount: number;
  status: 'draft' | 'approved' | 'rejected';
};

export type EditSigningBonusPayload = {
  positionName?: string;
  amount?: number;
  status?: 'draft' | 'approved' | 'rejected';
};

export const getAllSigningBonuses = async (): Promise<SigningBonus[]> => {
  const res = await axiosInstance.get('/payroll-configuration/signing-bonuses');
  return res.data;
};

export const getSigningBonusById = async (id: string): Promise<SigningBonus> => {
  const res = await axiosInstance.get(`/payroll-configuration/signing-bonuses/${id}`);
  return res.data;
};

export const createSigningBonus = async (data: CreateSigningBonusPayload): Promise<SigningBonus> => {
  const res = await axiosInstance.post('/payroll-configuration/signing-bonuses', data);
  return res.data;
};

export const updateSigningBonus = async (id: string, data: EditSigningBonusPayload): Promise<SigningBonus> => {
  const res = await axiosInstance.put(`/payroll-configuration/signing-bonuses/${id}`, data);
  return res.data;
};

export const deleteSigningBonus = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/payroll-configuration/signing-bonuses/${id}`);
};

