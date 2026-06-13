export interface SocialMediaLinks {
  linkedin_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  active_platforms: string[];
}

export interface OpportunityItem {
  title: string;
  company_name: string;
  location: string;
  type: string;
  stipend?: string | null;
  duration?: string | null;
  skills_required: string[];
  apply_url?: string | null;
  source: string;
}

export interface CompanyReviewSummary {
  overall_rating: number;
  work_life_balance?: number | null;
  career_growth?: number | null;
  review_count: number;
  top_pros: string[];
  top_cons: string[];
  student_verdict: string;
}

export interface GrowthIndicator {
  trend: string;
  growth_pct?: number | null;
  description: string;
}

export interface StudentTrustScore {
  total_score: number;
  company_tier: string;
  is_recommended: boolean;
  breakdown: Record<string, number>;
  verdict: string;
}

export interface CompanyStudentReport {
  company_name: string;
  trust_score: StudentTrustScore;
  growth: GrowthIndicator;
  social_media: SocialMediaLinks;
  reviews: CompanyReviewSummary;
  opportunities: OpportunityItem[];
  basic_info: Record<string, any>;
}
