export interface FounderProfile {
  name: string;
  biography?: string | null;
  founding_role?: string | null;
  current_position?: string | null;
  photo_url?: string | null;
  source?: string | null;
}

export interface HeadquartersInfo {
  full_address?: string | null;
  founding_date?: string | null;
  facility_details?: string | null;
  map_query?: string | null;
}

export interface GlobalOperation {
  country: string;
  office_locations: string[];
  service_offerings: string[];
  source?: string | null;
}

export interface CitationSource {
  title: string;
  url?: string | null;
  publisher?: string | null;
  verified: boolean;
}

export interface CompanyData {
  company_name: string;
  is_verified: boolean;
  verification_score: number;
  turnover_data: { year: string; revenue: number }[];
  company_history: string;
  founder_profiles: FounderProfile[];
  headquarters_info: HeadquartersInfo;
  global_operations: GlobalOperation[];
  citation_sources: CitationSource[];
  chapter_last_updated?: string | null;
  employee_count?: number | null;
  market_cap?: number | null;
}

export * from './student';
