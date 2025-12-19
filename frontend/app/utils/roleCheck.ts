// rolecheck.ts
// Unified Role + Permission utilities
// Covers: Organizational Structure, Profile Editing, Change Requests, Performance Appraisal

type UserProfile = any;

// ============================
// NORMALIZATION + BASE CHECK
// ============================

function normalizeRole(role: string): string {
  return String(role || "").toUpperCase().replace(/\s+/g, "_");
}

export function hasRole(userProfile: UserProfile, requiredRoles: string[]): boolean {
  if (!userProfile) return false;

  const normalizedRequired = requiredRoles.map(normalizeRole);
  const roleMatches = (r: unknown) =>
    typeof r === "string" && normalizedRequired.includes(normalizeRole(r));

  // systemRoles (string | { roleName } | { roles })
  const systemRoles = userProfile.systemRoles;
  if (Array.isArray(systemRoles)) {
    for (const roleObj of systemRoles) {
      if (typeof roleObj === "string" && roleMatches(roleObj)) return true;
      if (roleObj?.roles?.some(roleMatches)) return true;
      if (roleObj?.roleName && roleMatches(roleObj.roleName)) return true;
    }
  }

  // accessProfileId.roles
  if (userProfile.accessProfileId?.roles?.some(roleMatches)) return true;

  // direct roles
  if (Array.isArray(userProfile.roles) && userProfile.roles.some(roleMatches)) return true;

  return false;
}

// ============================
// CORE ROLE DEFINITIONS
// ============================

export function isSystemAdmin(user: UserProfile): boolean {
  return hasRole(user, ["SYSTEM_ADMIN"]);
}

export function isHRManager(user: UserProfile): boolean {
  return hasRole(user, ["HR_MANAGER", "HR_ADMIN"]) || isSystemAdmin(user);
}

export function isHREmployee(user: UserProfile): boolean {
  return hasRole(user, ["HR_EMPLOYEE"]) || isHRManager(user);
}

export function isLineManager(user: UserProfile): boolean {
  return hasRole(user, ["DEPARTMENT_HEAD", "DEPARTMENT_MANAGER"]);
}

export function isEmployee(user: UserProfile): boolean {
  return hasRole(user, ["DEPARTMENT_EMPLOYEE", "EMPLOYEE"]);
}

export function isAnyManager(user: UserProfile): boolean {
  return isLineManager(user) || isHRManager(user);
}

// ============================
// PERFORMANCE APPRAISAL
// ============================

export function canManageAppraisalTemplates(user: UserProfile): boolean {
  return isHRManager(user);
}

export function canCreateAndScheduleCycles(user: UserProfile): boolean {
  return isHREmployee(user);
}

export function canAssignAppraisalsInBulk(user: UserProfile): boolean {
  return isHREmployee(user);
}

export function canViewAssignedAppraisalsAsManager(user: UserProfile): boolean {
  return isLineManager(user) || isHRManager(user);
}

export function canFillManagerRatings(user: UserProfile): boolean {
  return isLineManager(user);
}

export function canMonitorAppraisalProgress(user: UserProfile): boolean {
  return isHREmployee(user);
}

export function canViewCompletionDashboard(user: UserProfile): boolean {
  return isHRManager(user);
}

export function canPublishAppraisalResults(user: UserProfile): boolean {
  return isHREmployee(user);
}

export function canRaiseAppraisalDispute(user: UserProfile): boolean {
  return isEmployee(user) || isHREmployee(user);
}

export function canResolveAppraisalDispute(user: UserProfile): boolean {
  return isHRManager(user);
}

// ============================
// ORGANIZATIONAL / HR LOGIC
// (Merged from old file)
// ============================

export function canViewTeamProfiles(user: UserProfile): boolean {
  return isLineManager(user) || isHRManager(user);
}

export function canReviewChangeRequests(user: UserProfile): boolean {
  return isHRManager(user);
}

export function canAccessAllEmployees(user: UserProfile): boolean {
  return isHRManager(user);
}

// ============================
// PROFILE EDITING RULES
// ============================

const NON_CRITICAL_PROFILE_FIELDS = [
  "mobilePhone",
  "homePhone",
  "personalEmail",
  "address",
  "profilePictureUrl",
] as const;

const CRITICAL_PROFILE_FIELDS = [
  "firstName",
  "middleName",
  "lastName",
  "nationalId",
  "maritalStatus",
  "dateOfBirth",
  "gender",
  "primaryPositionId",
  "primaryDepartmentId",
  "contractType",
  "workType",
  "bankName",
  "bankAccountNumber",
] as const;

export function canDirectlyEditProfile(user: UserProfile, field: string): boolean {
  if (isHRManager(user)) return true;
  if (isEmployee(user)) return NON_CRITICAL_PROFILE_FIELDS.includes(field as any);
  return false;
}

export function requiresChangeRequest(user: UserProfile, field: string): boolean {
  if (isHRManager(user)) return false;
  return CRITICAL_PROFILE_FIELDS.includes(field as any);
}
// Backward-compatible alias
export function isManager(userProfile: any): boolean {
  return isLineManager(userProfile) || isHRManager(userProfile);
}
// HR Admin (explicit role check, kept for backward compatibility)
export function isHRAdmin(user: UserProfile): boolean {
  return hasRole(user, ["HR_ADMIN"]) || isSystemAdmin(user);
}


// ============================
// DEBUG
// ============================

export function debugRoles(user: UserProfile): void {
  console.log("=== ROLE DEBUG ===");
  console.log("Roles:", user?.roles || user?.systemRoles);
  console.log("SystemAdmin:", isSystemAdmin(user));
  console.log("HRManager:", isHRManager(user));
  console.log("HREmployee:", isHREmployee(user));
  console.log("LineManager:", isLineManager(user));
  console.log("Employee:", isEmployee(user));
  console.log("=================");
}
