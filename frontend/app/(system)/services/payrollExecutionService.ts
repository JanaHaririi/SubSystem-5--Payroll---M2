// frontend/app/(system)/services/payrollExecutionService.ts
import ApiClient from "@/app/utils/ApiClient";

const base = "/payroll-execution";

export const payrollExecutionService = {
  // Data fetching
  getAllRuns: () => ApiClient.get(`${base}/runs`),
  createRun: (dto: any) => ApiClient.post(`${base}/runs`, dto),
  getRunById: (id: string) => ApiClient.get(`${base}/runs/${id}`),
  getEmployeesByRunId: (runId: string) => ApiClient.get(`${base}/runs/${runId}/employees`),
  getPayslipsByRunId: (runId: string) => ApiClient.get(`${base}/runs/${runId}/payslips`),
  getAllSigningBonuses: () => ApiClient.get(`${base}/signing-bonuses`),
  getAllExitBenefits: () => ApiClient.get(`${base}/exit-benefits`),

  // Phase 0 - signing bonus
  approveSigningBonus: (id: string) => ApiClient.post(`${base}/signing-bonus/${id}/approve`),
  rejectSigningBonus: (id: string) => ApiClient.post(`${base}/signing-bonus/${id}/reject`),
  editSigningBonus: (id: string, dto: any) => ApiClient.patch(`${base}/signing-bonus/${id}/edit`, dto),

  // Phase 0 - exit benefits
  approveExitBenefits: (id: string) => ApiClient.post(`${base}/exit-benefits/${id}/approve`),
  rejectExitBenefits: (id: string) => ApiClient.post(`${base}/exit-benefits/${id}/reject`),
  editExitBenefits: (id: string, dto: any) => ApiClient.patch(`${base}/exit-benefits/${id}/edit`, dto),

  validatePhase0: () => ApiClient.get(`${base}/phase-0/validate`),

  // Phase 1
  updatePayrollPeriod: (dto: any) => ApiClient.put(`${base}/phase1/update-period`, dto),
  startPayrollInitiation: (dto: any) => ApiClient.post(`${base}/phase1/start`, dto),

  // Phase 1.1
  generateDraft: (dto: any) => ApiClient.post(`${base}/generate-draft`, dto),
  processHREvents: (dto: any) => ApiClient.post(`${base}/process-hr-events`, dto),
  applyPenalties: (dto: any) => ApiClient.post(`${base}/apply-penalties`, dto),
  generateDraftFile: (dto: any) => ApiClient.post(`${base}/generate-draft-file`, dto),

  // Phase 2
  reviewDraft: (dto: any) => ApiClient.post(`${base}/phase2/review-draft`, dto),

  // Phase 3
  managerReview: (payrollRunId: string) => ApiClient.post(`${base}/phase3/review`, { payrollRunId }),
  managerApprove: (dto: any) => ApiClient.post(`${base}/phase3/manager-approve`, dto),
  financeApprove: (dto: any) => ApiClient.post(`${base}/phase3/finance-approve`, dto),
  lock: (dto: any) => ApiClient.patch(`${base}/phase3/lock`, dto),
  unfreeze: (dto: any) => ApiClient.patch(`${base}/phase3/unfreeze`, dto),

  // Phase 4
  generatePayslips: (dto: any) => ApiClient.post(`${base}/generate-payslips`, dto),
};
