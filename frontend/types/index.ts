export interface CompanyData {
  company_name: string;
  is_verified: boolean;
  verification_score: number;
  turnover_data: { year: string; revenue: number }[];
  company_history: string;
}
