export enum ClaimStatus {
  UNDER_REVIEW = 'under review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
export enum DisputeStatus {
  UNDER_REVIEW = 'under review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
export enum RefundStatus {
  PENDING = 'pending',
  PAID = 'paid', // when payroll execution
}

export enum ClaimReviewStatus {
  PENDING = 'pending',
  RECOMMEND_APPROVE = 'recommend_approve',
  RECOMMEND_REJECT = 'recommend_reject',
}

export enum DisputeReviewStatus {
  PENDING = 'pending',
  RECOMMEND_APPROVE = 'recommend_approve',
  RECOMMEND_REJECT = 'recommend_reject',
}
