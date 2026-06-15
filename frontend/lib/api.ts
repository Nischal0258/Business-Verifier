import axios, { AxiosError, AxiosInstance } from "axios";
import { CompanyData } from "@/types";

const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return window.location.origin;
  }
  return "http://localhost:8000";
};

interface RawTurnoverItem {
  year: number;
  revenue: number | null;
}

interface RawCompanyData {
  is_verified: boolean;
  verification_score: number;
  turnover_data: RawTurnoverItem[];
  company_history: string;
  founder_profiles?: Array<{
    name: string;
    biography?: string | null;
    founding_role?: string | null;
    current_position?: string | null;
    photo_url?: string | null;
    source?: string | null;
  }>;
  headquarters_info?: {
    full_address?: string | null;
    founding_date?: string | null;
    facility_details?: string | null;
    map_query?: string | null;
  };
  global_operations?: Array<{
    country: string;
    office_locations?: string[];
    service_offerings?: string[];
    source?: string | null;
  }>;
  citation_sources?: Array<{
    title: string;
    url?: string | null;
    publisher?: string | null;
    verified?: boolean;
  }>;
  chapter_last_updated?: string | null;
  employee_count?: number | null;
  market_cap?: number | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  retryable?: boolean;
}

enum ErrorCode {
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT = "RATE_LIMIT",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: AxiosError): boolean {
  if (error.response) {
    const status = error.response.status;
    return (
      status === 429 ||
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504
    );
  }
  return !error.response && error.request !== null;
}

function categorizeError(error: unknown): ErrorCode {
  if (error instanceof AxiosError) {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return ErrorCode.TIMEOUT_ERROR;
    }
    if (!error.response && error.request) {
      return ErrorCode.NETWORK_ERROR;
    }
    if (error.response) {
      const status = error.response.status;
      if (status === 404) return ErrorCode.NOT_FOUND;
      if (status === 422) return ErrorCode.VALIDATION_ERROR;
      if (status === 429) return ErrorCode.RATE_LIMIT;
      if (status >= 500) return ErrorCode.SERVER_ERROR;
    }
  }
  return ErrorCode.UNKNOWN_ERROR;
}

// Alias for backward compatibility
const classifyError = categorizeError;

function getUserFriendlyMessage(errorCode: ErrorCode, error?: AxiosError): string {
  switch (errorCode) {
    case ErrorCode.NETWORK_ERROR:
      return "Unable to connect to the server. Please check your internet connection and try again.";
    case ErrorCode.TIMEOUT_ERROR:
      return "The request is taking longer than expected. Please try again.";
    case ErrorCode.SERVER_ERROR:
      return "The server is experiencing technical difficulties. Please try again in a few moments.";
    case ErrorCode.NOT_FOUND:
      return "The requested company was not found. Please verify the company name and try again.";
    case ErrorCode.VALIDATION_ERROR:
      return "Invalid request. Please check your input and try again.";
    case ErrorCode.RATE_LIMIT:
      return "Too many requests. Please wait a moment before trying again.";
    default:
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as { error?: string; message?: string } | undefined;
        if (errorData?.error) {
          return String(errorData.error);
        }
        if (errorData?.message) {
          return String(errorData.message);
        }
      }
      return "An unexpected error occurred. Please try again.";
  }
}

function createApiClient(): AxiosInstance {
  const apiBase = getApiBaseUrl();

  const client = axios.create({
    baseURL: apiBase,
    timeout: 60000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;

      if (!originalRequest || !isRetryableError(error)) {
        return Promise.reject(error);
      }

      const retryConfig = DEFAULT_RETRY_CONFIG;
      let lastError = error;

      for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
        if (attempt > 0) {
          const delay = Math.min(
            retryConfig.initialDelay * Math.pow(2, attempt - 1),
            retryConfig.maxDelay
          );
          await sleep(delay);
        }

        try {
          const response = await axios(originalRequest);
          return response;
        } catch (retryError) {
          lastError = retryError as AxiosError;
          if (!isRetryableError(lastError)) {
            break;
          }
        }
      }

      return Promise.reject(lastError);
    }
  );

  return client;
}

const apiClient = createApiClient();

export async function fetchCompanyData(
  name: string,
  retryConfig?: Partial<RetryConfig>
): Promise<CompanyData> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  const encodedName = encodeURIComponent(name.trim());
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await apiClient.get<ApiResponse<RawCompanyData>>(
        `/api/verify/${encodedName}`,
        {
          timeout: 15000,
        }
      );

      if (response.status !== 200) {
        throw new Error(
          `Server returned status ${response.status}. Please try again later.`
        );
      }

      const envelope = response.data;

      if (!envelope.success || !envelope.data) {
        throw new Error(
          envelope.error || "Failed to fetch company data. Please try again."
        );
      }

      const raw = envelope.data;

      return {
        company_name: name,
        is_verified: raw.is_verified,
        verification_score: raw.verification_score,
        turnover_data: (raw.turnover_data || []).map((item) => ({
          year: item.year.toString(),
          revenue: item.revenue ?? 0,
        })),
        company_history: raw.company_history,
        founder_profiles: raw.founder_profiles || [],
        headquarters_info: raw.headquarters_info || {},
        global_operations: (raw.global_operations || []).map((op) => ({
          country: op.country,
          office_locations: op.office_locations || [],
          service_offerings: op.service_offerings || [],
          source: op.source ?? null,
        })),
        citation_sources: (raw.citation_sources || []).map((c) => ({
          title: c.title,
          url: c.url ?? null,
          publisher: c.publisher ?? null,
          verified: Boolean(c.verified),
        })),
        chapter_last_updated: raw.chapter_last_updated ?? null,
        employee_count: raw.employee_count ?? null,
        market_cap: raw.market_cap ?? null,
      };
    } catch (error) {
      lastError = error;

      if (error instanceof AxiosError) {
        const errorCode = categorizeError(error);

        if (
          errorCode === ErrorCode.NOT_FOUND ||
          errorCode === ErrorCode.VALIDATION_ERROR
        ) {
          throw {
            message: getUserFriendlyMessage(errorCode, error),
            code: errorCode,
            status: error.response?.status,
            retryable: false,
          };
        }

        if (!isRetryableError(error) || attempt === config.maxRetries) {
          throw {
            message: getUserFriendlyMessage(errorCode, error),
            code: errorCode,
            status: error.response?.status,
            retryable: false,
          };
        }
      } else if (error instanceof Error) {
        throw {
          message: error.message,
          code: ErrorCode.UNKNOWN_ERROR,
          retryable: false,
        };
      }

      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.initialDelay * Math.pow(2, attempt),
          config.maxDelay
        );
        await sleep(delay);
      }
    }
  }

  throw {
    message: getUserFriendlyMessage(ErrorCode.UNKNOWN_ERROR),
    code: ErrorCode.UNKNOWN_ERROR,
    retryable: false,
  };
}

export async function downloadCompanyPdf(name: string): Promise<void> {
  const encodedName = encodeURIComponent(name.trim());

  try {
    const response = await apiClient.get(
      `/api/verify/${encodedName}/pdf`,
      {
        responseType: "blob",
        timeout: 30000,
      }
    );

    if (response.status !== 200) {
      throw new Error(
        `Server returned status ${response.status}. PDF generation failed.`
      );
    }

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/\s+/g, "_")}_report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = categorizeError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: false,
      };
    }
    throw {
      message: "Failed to download PDF. Please try again.",
      code: ErrorCode.UNKNOWN_ERROR,
      retryable: false,
    };
  }
}

export function checkNetworkStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.onLine) {
      resolve(false);
      return;
    }

    const apiBase = getApiBaseUrl();
    fetch(`${apiBase}/api/health`, {
      method: "HEAD",
      cache: "no-cache",
    })
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
}

export function isOnline(): boolean {
  return navigator.onLine;
}

/* ═══════════════════════════════════════════════════════════════════
   InternIQ v3 — Student API Functions
   ═══════════════════════════════════════════════════════════════════ */

import type { CompanyStudentReport } from "@/types/student";

interface StudentApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Fetch a student-oriented company report via CrewAI agents.
 * Hits: GET /api/v1/student/company/{company_name}
 */
export async function fetchStudentCompanyReport(
  companyName: string
): Promise<CompanyStudentReport> {
  const apiBase = getApiBaseUrl();
  const encoded = encodeURIComponent(companyName.trim());

  try {
    const response = await apiClient.get<StudentApiResponse<CompanyStudentReport>>(
      `${apiBase}/api/v1/student/company/${encoded}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to fetch student report");
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: errorCode === ErrorCode.NETWORK_ERROR || errorCode === ErrorCode.TIMEOUT_ERROR,
      } as ApiError;
    }
    throw error;
  }
}

/**
 * Compare multiple companies via CrewAI.
 * Hits: GET /api/v1/student/compare?companies=A,B,C
 */
export async function compareCompanies(
  companies: string[]
): Promise<{ comparison: string; result: string }> {
  const apiBase = getApiBaseUrl();
  const joined = companies.map((c) => c.trim()).join(",");

  try {
    const response = await apiClient.get<StudentApiResponse<{ comparison: string; result: string }>>(
      `${apiBase}/api/v1/student/compare`,
      { params: { companies: joined } }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Comparison failed");
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: false,
      } as ApiError;
    }
    throw error;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   InternIQ v3 — Phase 3/4 API Functions
   ═══════════════════════════════════════════════════════════════════ */

async function callAiSystemManager(
  industry: string,
  location: string,
  query?: string
): Promise<ApiResponse<any>> {
  const response = await apiClient.post("/api/v1/students/ai-system-manager", {
    industry,
    location,
    query,
  });
  return response.data;
}
// --- Students API Functions ---

/**
 * Fetch internship/job opportunities with filters
 */
export async function fetchOpportunities(
  params?: {
    location?: string;
    job_type?: string;
    company_name?: string;
    search?: string;
    limit?: number;
  }
): Promise<OpportunityItem[]> {
  const apiBase = getApiBaseUrl();
  try {
    const response = await apiClient.get<StudentApiResponse<OpportunityItem[]>>(
      `${apiBase}/api/v1/students/opportunities`,
      { params }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to fetch opportunities");
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: errorCode === ErrorCode.NETWORK_ERROR || errorCode === ErrorCode.TIMEOUT_ERROR,
      } as ApiError;
    }
    throw error;
  }
}

/**
 * Add a company to favorites
 */
export async function addFavorite(
  favorite: FavoriteCompanyCreate
): Promise<FavoriteCompanyResponse> {
  const apiBase = getApiBaseUrl();
  try {
    const response = await apiClient.post<StudentApiResponse<FavoriteCompanyResponse>>(
      `${apiBase}/api/v1/students/favorites`,
      favorite
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to add favorite");
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: false,
      } as ApiError;
    }
    throw error;
  }
}

/**
 * Remove a company from favorites
 */
export async function removeFavorite(companyName: string): Promise<void> {
  const apiBase = getApiBaseUrl();
  const encoded = encodeURIComponent(companyName.trim());
  try {
    const response = await apiClient.delete<StudentApiResponse<unknown>>(
      `${apiBase}/api/v1/students/favorites/${encoded}`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to remove favorite");
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: false,
      } as ApiError;
    }
    throw error;
  }
}

/**
 * Get user's favorite companies
 */
export async function getFavorites(): Promise<FavoriteCompanyResponse[]> {
  const apiBase = getApiBaseUrl();
  try {
    const response = await apiClient.get<StudentApiResponse<FavoriteCompanyResponse[]>>(
      `${apiBase}/api/v1/students/favorites`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to fetch favorites");
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: errorCode === ErrorCode.NETWORK_ERROR || errorCode === ErrorCode.TIMEOUT_ERROR,
      } as ApiError;
    }
    throw error;
  }
}

/**
 * Submit a student review
 */
export async function submitReview(
  review: InternalStudentReviewCreate
): Promise<InternalStudentReviewResponse> {
  const apiBase = getApiBaseUrl();
  try {
    const response = await apiClient.post<StudentApiResponse<InternalStudentReviewResponse>>(
      `${apiBase}/api/v1/students/reviews`,
      review
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to submit review");
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: false,
      } as ApiError;
    }
    throw error;
  }
}

/**
 * Get reviews for a specific company
 */
export async function getCompanyReviews(
  companyName: string,
  limit?: number
): Promise<InternalStudentReviewResponse[]> {
  const apiBase = getApiBaseUrl();
  const encoded = encodeURIComponent(companyName.trim());
  try {
    const response = await apiClient.get<StudentApiResponse<InternalStudentReviewResponse[]>>(
      `${apiBase}/api/v1/students/reviews/${encoded}`,
      { params: { limit } }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to fetch company reviews");
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: errorCode === ErrorCode.NETWORK_ERROR || errorCode === ErrorCode.TIMEOUT_ERROR,
      } as ApiError;
    }
    throw error;
  }
}

// --- Companies API Functions ---

/**
 * Get a company's social media links
 */
export async function getCompanySocialMedia(
  companyName: string
): Promise<SocialMediaLinks> {
  const apiBase = getApiBaseUrl();
  const encoded = encodeURIComponent(companyName.trim());
  try {
    const response = await apiClient.get<StudentApiResponse<SocialMediaLinks>>(
      `${apiBase}/api/v1/companies/${encoded}/social`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to fetch social media");
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: errorCode === ErrorCode.NETWORK_ERROR || errorCode === ErrorCode.TIMEOUT_ERROR,
      } as ApiError;
    }
    throw error;
  }
}

/**
 * Get a company's aggregated review summary
 */
export async function getCompanyReviewSummary(
  companyName: string
): Promise<CompanyReviewSummary> {
  const apiBase = getApiBaseUrl();
  const encoded = encodeURIComponent(companyName.trim());
  try {
    const response = await apiClient.get<StudentApiResponse<CompanyReviewSummary>>(
      `${apiBase}/api/v1/companies/${encoded}/reviews`
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to fetch review summary");
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: errorCode === ErrorCode.NETWORK_ERROR || errorCode === ErrorCode.TIMEOUT_ERROR,
      } as ApiError;
    }
    throw error;
  }
}

/**
 * Get opportunities for a specific company
 */
export async function getCompanyOpportunities(
  companyName: string,
  limit?: number
): Promise<OpportunityItem[]> {
  const apiBase = getApiBaseUrl();
  const encoded = encodeURIComponent(companyName.trim());
  try {
    const response = await apiClient.get<StudentApiResponse<OpportunityItem[]>>(
      `${apiBase}/api/v1/companies/${encoded}/opportunities`,
      { params: { limit } }
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || "Failed to fetch company opportunities");
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: errorCode === ErrorCode.NETWORK_ERROR || errorCode === ErrorCode.TIMEOUT_ERROR,
      } as ApiError;
    }
    throw error;
  }
}

/**
 * Refresh company data via CrewAI
 */
export async function refreshCompanyData(companyName: string): Promise<void> {
  const apiBase = getApiBaseUrl();
  const encoded = encodeURIComponent(companyName.trim());
  try {
    const response = await apiClient.post<StudentApiResponse<unknown>>(
      `${apiBase}/api/v1/companies/${encoded}/refresh`
    );
    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to refresh company data");
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorCode = classifyError(error);
      throw {
        message: getUserFriendlyMessage(errorCode, error),
        code: errorCode,
        status: error.response?.status,
        retryable: false,
      } as ApiError;
    }
    throw error;
  }
}
