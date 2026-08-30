/* ═══════════════════════════════════════════════════════════════════
   InternIQ v3 - Student Types
   Mirrors backend schemas.py student models
   ═══════════════════════════════════════════════════════════════════ */

import type { CitationSource } from './index';

export interface StudentTrustScore {
  total_score: number;
  is_recommended: boolean;
  company_tier: 'established' | 'rising_star' | 'emerging' | 'unknown';
  breakdown: Record<string, number>;
  verdict: string;
}

export interface SocialMediaLinks {
  linkedin_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  active_platforms: string[];
  social_presence_score: number;
}

export interface OpportunityItem {
  id?: number | null;
  title: string;
  company_name: string;
  location: string;
  type: 'internship' | 'full_time' | 'part_time' | 'contract';
  stipend?: string | null;
  duration?: string | null;
  skills_required: string[];
  apply_url: string;
  posted_date?: string | null;
  source: string;
  is_active: boolean;
}

export interface CompanyReviewSummary {
  overall_rating?: number | null;
  work_life_balance?: number | null;
  career_growth?: number | null;
  salary_satisfaction?: number | null;
  review_count: number;
  recommend_to_friend_pct?: number | null;
  top_pros: string[];
  top_cons: string[];
  student_verdict: string;
  source: string;
  source_url?: string | null;
}

export interface GrowthIndicator {
  trend: 'growing' | 'stable' | 'declining' | 'unknown';
  growth_pct?: number | null;
  description: string;
}

export interface CompanyStudentReport {
  company_name: string;
  industry?: string | null;
  sector?: string | null;
  founded?: string | null;
  employee_count?: number | null;
  website?: string | null;
  description: string;
  headquarters?: string | null;
  founders: string[];

  student_trust_score: StudentTrustScore;
  social_media: SocialMediaLinks;
  opportunities: OpportunityItem[];
  total_opportunities: number;
  reviews: CompanyReviewSummary;
  growth: GrowthIndicator;

  company_history: string;
  is_verified: boolean;
  verification_score: number;
  citation_sources: CitationSource[];
  agent_execution_log?: string | null;
}

export interface ExploreFilters {
  location: string;
  industry: string;
  type: 'all' | 'internship' | 'full_time' | 'part_time';
  sort_by: 'relevance' | 'date' | 'rating';
}

// --- User & Favorites Types ---

export interface FavoriteCompanyCreate {
  company_name: string;
  alerts_enabled: boolean;
}

export interface FavoriteCompanyResponse {
  id: number;
  company_name: string;
  alerts_enabled: boolean;
}

// --- Internal Student Review Types ---

export interface InternalStudentReviewCreate {
  rating: number;
  review_text: string;
  is_internship: boolean;
  company_name: string;
}

export interface InternalStudentReviewResponse {
  id: number;
  user_id: number;
  company_name: string;
  rating: number;
  review_text: string;
  is_internship: boolean;
  created_at: string;
}
