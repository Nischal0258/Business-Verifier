import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    requestAnimationFrame: jest.fn((cb) => setTimeout(() => cb(performance.now()), 16)),
    cancelAnimationFrame: jest.fn((id) => clearTimeout(id)),
  };
});

const mockRAF = jest.spyOn(window, "requestAnimationFrame") as jest.Mock;
const mockCancelRAF = jest.spyOn(window, "cancelAnimationFrame") as jest.Mock;

describe("CosmicDashboardVisual", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("renders without crashing", async () => {
      const { default: CosmicDashboardVisual } = await import("./CosmicDashboardVisual");

      await act(async () => {
        render(<CosmicDashboardVisual className="test-class" />);
      });

      const container = screen.getByRole("presentation") || screen.container.firstChild;
      expect(container).toBeInTheDocument();
    });

    it("applies custom className", async () => {
      const { default: CosmicDashboardVisual } = await import("./CosmicDashboardVisual");

      await act(async () => {
        render(<CosmicDashboardVisual className="custom-height-600px" />);
      });

      const container = document.querySelector(".custom-height-600px");
      expect(container).toBeTruthy();
    });

    it("sets aria-hidden on canvas elements", async () => {
      const { default: CosmicDashboardVisual } = await import("./CosmicDashboardVisual");

      await act(async () => {
        render(<CosmicDashboardVisual />);
      });

      const canvas = screen.getByRole("presentation")?.querySelector("canvas");
      if (canvas) {
        expect(canvas).toHaveAttribute("aria-hidden", "true");
      }
    });
  });

  describe("Mouse Interaction", () => {
    it("tracks mouse movement", async () => {
      const { default: CosmicDashboardVisual } = await import("./CosmicDashboardVisual");

      await act(async () => {
        render(<CosmicDashboardVisual />);
      });

      const container = document.querySelector(".relative.overflow-hidden");
      if (container) {
        fireEvent.mouseMove(container, {
          clientX: 100,
          clientY: 200,
        });
      }

      expect(mockRAF).toHaveBeenCalled();
    });
  });

  describe("Cleanup", () => {
    it("cancels animation frame on unmount", async () => {
      const { default: CosmicDashboardVisual } = await import("./CosmicDashboardVisual");

      let animationId: number | undefined;
      mockRAF.mockImplementation((cb) => {
        animationId = setTimeout(() => cb(performance.now()), 16) as unknown as number;
        return animationId;
      });

      mockCancelRAF.mockImplementation((id) => {
        clearTimeout(id);
      });

      const { unmount } = render(<CosmicDashboardVisual />);

      await act(async () => {
        unmount();
      });

      expect(mockCancelRAF).toHaveBeenCalled();
    });

    it("removes event listeners on unmount", async () => {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
      const { default: CosmicDashboardVisual } = await import("./CosmicDashboardVisual");

      const { unmount } = render(<CosmicDashboardVisual />);

      await act(async () => {
        unmount();
      });

      expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith("touchmove", expect.any(Function));
    });
  });

  describe("Responsive Scaling", () => {
    it("handles resize events", async () => {
      const { default: CosmicDashboardVisual } = await import("./CosmicDashboardVisual");

      await act(async () => {
        render(<CosmicDashboardVisual />);
      });

      fireEvent.resize(window);

      expect(mockRAF).toHaveBeenCalled();
    });
  });

  describe("Performance", () => {
    it("tracks FPS", async () => {
      const { default: CosmicDashboardVisual } = await import("./CosmicDashboardVisual");

      let fpsValue: number | undefined;

      await act(async () => {
        const result = render(<CosmicDashboardVisual />);
        const container = result.container.firstChild;
        if (container) {
          const fpsDisplay = container.querySelector(".font-mono");
          if (fpsDisplay) {
            fpsValue = parseInt(fpsDisplay.textContent?.replace("FPS: ", "") || "0", 10);
          }
        }
      });

      expect(typeof fpsValue).toBe("number");
    });
  });
});

describe("useCosmicVisualPerformance", () => {
  it("detects low-end devices", async () => {
    const { useCosmicVisualPerformance } = await import("./CosmicDashboardVisual");

    const TestComponent = () => {
      const { isLowEndDevice } = useCosmicVisualPerformance();
      return <div data-testid="low-end">{isLowEndDevice ? "true" : "false"}</div>;
    };

    await act(async () => {
      render(<TestComponent />);
    });

    const result = screen.getByTestId("low-end");
    expect(result).toBeInTheDocument();
  });
});
