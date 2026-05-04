import axios from "axios";
import { CompanyData } from "@/types";

const API_BASE = "http://localhost:8000";

interface RawTurnoverItem {
  year: number;
  revenue: number | null;
}

interface RawCompanyData {
  is_verified: boolean;
  verification_score: number;
  turnover_data: RawTurnoverItem[];
  company_history: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
}

export async function fetchCompanyData(name: string): Promise<CompanyData> {
  const response = await axios.get<ApiResponse<RawCompanyData>>(
    `${API_BASE}/api/verify/${encodeURIComponent(name)}`
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
  };
}

export async function downloadCompanyPdf(name: string): Promise<void> {
  const response = await axios.get(
    `${API_BASE}/api/verify/${encodeURIComponent(name)}/pdf`,
    { responseType: "blob" }
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
}
