import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import DashboardContent from "@/app/dashboard/page";
import { fetchCompanyData, downloadCompanyPdf, checkNetworkStatus, isOnline, ApiError } from "@/lib/api";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/dashboard",
}));

// Mock lenis
jest.mock("lenis", () => {
  return jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
    scrollTo: jest.fn(),
  }));
});

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    nav: ({ children, ...props }: any) => <nav {...props}>{children}</nav>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  useInView: () => true,
  AnimatePresence: ({ children }: any) => children,
}));

// Mock axios
jest.mock("axios", () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  })),
  AxiosError: class extends Error {
    response?: { status: number; data: any };
    request?: any;
    code?: string;

    constructor(message: string, code?: string) {
      super(message);
      this.name = "AxiosError";
      this.code = code;
    }
  },
}));

describe("API Error Handling and Retry Mechanisms", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("fetchCompanyData - Network Errors", () => {
    it("handles network errors gracefully", async () => {
      const mockAxios = require("axios");
      const mockClient = {
        get: jest.fn().mockRejectedValue(
          new mockAxios.AxiosError("Network Error", "ECONNREFUSED")
        ),
        interceptors: {
          response: {
            use: jest.fn((successFn, errorFn) => errorFn({ config: {} })),
          },
        },
      };
      mockAxios.create.mockReturnValue(mockClient);

      let error: ApiError | undefined;
      try {
        await fetchCompanyData("Test Company");
      } catch (e) {
        error = e as ApiError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain("Unable to connect");
      expect(error?.code).toBe("NETWORK_ERROR");
      expect(error?.retryable).toBe(false);
    });

    it("handles timeout errors with user-friendly message", async () => {
      const mockAxios = require("axios");
      const mockClient = {
        get: jest.fn().mockRejectedValue(
          new mockAxios.AxiosError("timeout of 15000ms exceeded", "ECONNABORTED")
        ),
        interceptors: {
          response: {
            use: jest.fn(),
          },
        },
      };
      mockAxios.create.mockReturnValue(mockClient);

      let error: ApiError | undefined;
      try {
        await fetchCompanyData("Test Company");
      } catch (e) {
        error = e as ApiError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain("taking longer than expected");
      expect(error?.code).toBe("TIMEOUT_ERROR");
    });

    it("handles 404 not found errors", async () => {
      const mockAxios = require("axios");
      const mockClient = {
        get: jest.fn().mockRejectedValue({
          response: { status: 404, data: { error: "Company not found" } },
          name: "AxiosError",
          message: "Request failed",
        }),
        interceptors: {
          response: {
            use: jest.fn(),
          },
        },
      };
      mockAxios.create.mockReturnValue(mockClient);

      let error: ApiError | undefined;
      try {
        await fetchCompanyData("Nonexistent Company");
      } catch (e) {
        error = e as ApiError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain("not found");
      expect(error?.code).toBe("NOT_FOUND");
    });

    it("handles 500 server errors", async () => {
      const mockAxios = require("axios");
      const mockClient = {
        get: jest.fn().mockRejectedValue({
          response: { status: 500, data: { error: "Internal server error" } },
          name: "AxiosError",
          message: "Request failed",
        }),
        interceptors: {
          response: {
            use: jest.fn(),
          },
        },
      };
      mockAxios.create.mockReturnValue(mockClient);

      let error: ApiError | undefined;
      try {
        await fetchCompanyData("Test Company");
      } catch (e) {
        error = e as ApiError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain("technical difficulties");
      expect(error?.code).toBe("SERVER_ERROR");
    });

    it("handles 429 rate limit errors", async () => {
      const mockAxios = require("axios");
      const mockClient = {
        get: jest.fn().mockRejectedValue({
          response: { status: 429, data: { error: "Too many requests" } },
          name: "AxiosError",
          message: "Request failed",
        }),
        interceptors: {
          response: {
            use: jest.fn(),
          },
        },
      };
      mockAxios.create.mockReturnValue(mockClient);

      let error: ApiError | undefined;
      try {
        await fetchCompanyData("Test Company");
      } catch (e) {
        error = e as ApiError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain("Too many requests");
      expect(error?.code).toBe("RATE_LIMIT");
    });
  });

  describe("fetchCompanyData - Retry Mechanisms", () => {
    it("retries on retryable errors", async () => {
      const mockAxios = require("axios");
      let attemptCount = 0;
      const mockClient = {
        get: jest.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount < 3) {
            return Promise.reject({
              response: { status: 503, data: { error: "Service unavailable" } },
              name: "AxiosError",
              message: "Request failed",
              request: {},
            });
          }
          return Promise.resolve({
            status: 200,
            data: {
              success: true,
              data: {
                is_verified: true,
                verification_score: 85,
                turnover_data: [],
                company_history: "Test history",
              },
            },
          });
        }),
        interceptors: {
          response: {
            use: jest.fn(),
          },
        },
      };
      mockAxios.create.mockReturnValue(mockClient);

      const result = await fetchCompanyData("Test Company");

      expect(result).toBeDefined();
      expect(result.company_name).toBe("Test Company");
      expect(attemptCount).toBeGreaterThanOrEqual(1);
    });

    it("does not retry on non-retryable errors", async () => {
      const mockAxios = require("axios");
      let attemptCount = 0;
      const mockClient = {
        get: jest.fn().mockImplementation(() => {
          attemptCount++;
          return Promise.reject({
            response: { status: 404, data: { error: "Not found" } },
            name: "AxiosError",
            message: "Request failed",
          });
        }),
        interceptors: {
          response: {
            use: jest.fn(),
          },
        },
      };
      mockAxios.create.mockReturnValue(mockClient);

      let error: ApiError | undefined;
      try {
        await fetchCompanyData("Test Company");
      } catch (e) {
        error = e as ApiError;
      }

      expect(error).toBeDefined();
      expect(attemptCount).toBe(1);
      expect(error?.retryable).toBe(false);
    });

    it("respects custom retry configuration", async () => {
      const mockAxios = require("axios");
      let attemptCount = 0;
      const mockClient = {
        get: jest.fn().mockImplementation(() => {
          attemptCount++;
          return Promise.reject({
            response: { status: 503, data: { error: "Service unavailable" } },
            name: "AxiosError",
            message: "Request failed",
            request: {},
          });
        }),
        interceptors: {
          response: {
            use: jest.fn(),
          },
        },
      };
      mockAxios.create.mockReturnValue(mockClient);

      let error: ApiError | undefined;
      try {
        await fetchCompanyData("Test Company", { maxRetries: 1, initialDelay: 100, maxDelay: 200 });
      } catch (e) {
        error = e as ApiError;
      }

      expect(error).toBeDefined();
      expect(attemptCount).toBeLessThanOrEqual(2);
    });
  });

  describe("downloadCompanyPdf - Error Handling", () => {
    it("handles PDF download network errors", async () => {
      const mockAxios = require("axios");
      const mockClient = {
        get: jest.fn().mockRejectedValue(
          new mockAxios.AxiosError("Network Error", "ECONNREFUSED")
        ),
        interceptors: {
          response: {
            use: jest.fn(),
          },
        },
      };
      mockAxios.create.mockReturnValue(mockClient);

      let error: ApiError | undefined;
      try {
        await downloadCompanyPdf("Test Company");
      } catch (e) {
        error = e as ApiError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain("Unable to connect");
    });

    it("handles PDF generation server errors", async () => {
      const mockAxios = require("axios");
      const mockClient = {
        get: jest.fn().mockRejectedValue({
          response: { status: 500, data: { error: "PDF generation failed" } },
          name: "AxiosError",
          message: "Request failed",
        }),
        interceptors: {
          response: {
            use: jest.fn(),
          },
        },
      };
      mockAxios.create.mockReturnValue(mockClient);

      let error: ApiError | undefined;
      try {
        await downloadCompanyPdf("Test Company");
      } catch (e) {
        error = e as ApiError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain("technical difficulties");
    });
  });

  describe("Network Status Checks", () => {
    it("checkNetworkStatus returns true when online", async () => {
      Object.defineProperty(navigator, "onLine", { value: true, writable: true });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const status = await checkNetworkStatus();
      expect(status).toBe(true);
    });

    it("checkNetworkStatus returns false when offline", async () => {
      Object.defineProperty(navigator, "onLine", { value: false, writable: true });

      const status = await checkNetworkStatus();
      expect(status).toBe(false);
    });

    it("isOnline returns navigator.onLine status", () => {
      Object.defineProperty(navigator, "onLine", { value: true, writable: true });
      expect(isOnline()).toBe(true);

      Object.defineProperty(navigator, "onLine", { value: false, writable: true });
      expect(isOnline()).toBe(false);
    });
  });
});

describe("Dashboard Error Display", () => {
  it("renders retry button on network error", async () => {
    render(<DashboardContent />);

    const textarea = screen.getByPlaceholderText("Ask VerifyIQ about any entity...");
    fireEvent.change(textarea, { target: { value: "Test Company" } });

    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  it("displays appropriate error context labels", async () => {
    render(<DashboardContent />);

    const textarea = screen.getByPlaceholderText("Ask VerifyIQ about any entity...");
    fireEvent.change(textarea, { target: { value: "Test Company" } });

    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const errorLabel = screen.getByText(/Connection_Error|Timeout_Error|Access_Denied/i);
      expect(errorLabel).toBeInTheDocument();
    });
  });

  it("allows resetting session after error", async () => {
    render(<DashboardContent />);

    const textarea = screen.getByPlaceholderText("Ask VerifyIQ about any entity...");
    fireEvent.change(textarea, { target: { value: "Test Company" } });

    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      const resetButton = screen.getByRole("button", { name: /Reset_Session/i });
      expect(resetButton).toBeInTheDocument();
    });

    const resetButton = screen.getByRole("button", { name: /Reset_Session/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });
});
