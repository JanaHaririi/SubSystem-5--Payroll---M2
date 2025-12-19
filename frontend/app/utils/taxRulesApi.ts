import axiosInstance from './ApiClient';

export type CreateTaxRulePayload = {
  name: string;
  description?: string;
  rate: number;
  status: 'draft' | 'approved' | 'rejected';
};

export type EditTaxRulePayload = {
  name?: string;
  description?: string;
  rate?: number;
  status?: 'draft' | 'approved' | 'rejected';
};

export const createTaxRule = async (payload: CreateTaxRulePayload) => {
  const res = await axiosInstance.post('/payroll-configuration/tax-rules', payload);
  return res.data;
};

export const updateTaxRule = async (id: string, payload: EditTaxRulePayload) => {
  const res = await axiosInstance.put(`/payroll-configuration/tax-rules/${id}`, payload);
  return res.data;
};

export const getTaxRuleById = async (id: string) => {
  const res = await axiosInstance.get(`/payroll-configuration/tax-rules/${id}`);
  return res.data;
};

export const getAllTaxRules = async () => {
  const res = await axiosInstance.get('/payroll-configuration/tax-rules');
  return res.data;
};

export const deleteTaxRule = async (id: string) => {
  const res = await axiosInstance.delete(`/payroll-configuration/tax-rules/${id}`);
  return res.data;
};

