export interface BranchAuthorizedRepresentative {
  id?: number;

  branchCode?: string;
  branchName?: string;

  representativeName?: string;
  representativeTitle?: string;

  authorizationDocNo?: string;
  authorizationDocDate?: string; // ISO date: yyyy-MM-dd
  authorizationIssuer?: string;

  effectiveFrom?: string; // ISO date
  effectiveTo?: string | null;

  isActive?: boolean;
}
