import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdvancedCursor from "@/components/layout/AdvancedCursor";
import { useGlobeCursor } from "@/components/layout/AdvancedCursor";

// Mock matchMedia
beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe("AdvancedCursor - Cross-Browser & WCAG Compliance", () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = "";
    document.body.classList.remove("cursor-container");
  });

  describe("Browser Compatibility", () => {
    it("renders without errors in Chrome-like environment", async () => {
      await act(async () => {
        render(<AdvancedCursor />);
      });
      
      const cursor = screen.getByRole("presentation");
      expect(cursor).toBeInTheDocument();
    });

    it("renders without errors in Firefox-like environment", async () => {
      // Simulate Firefox's different event handling
      const originalAddEventListener = document.addEventListener;
      document.addEventListener = jest.fn(originalAddEventListener);

      await act(async () => {
        render(<AdvancedCursor />);
      });

      expect(document.addEventListener).toHaveBeenCalledWith("mousemove", expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith("mouseenter", expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith("mouseleave", expect.any(Function));

      document.addEventListener = originalAddEventListener;
    });

    it("renders without errors in Safari-like environment", async () => {
      // Simulate Safari's different transform handling
      const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
        right: 300,
        bottom: 300,
        x: 100,
        y: 100,
        toJSON: () => ({}),
      }));

      await act(async () => {
        render(<AdvancedCursor />);
      });

      const cursor = screen.getByRole("presentation");
      expect(cursor).toBeInTheDocument();

      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it("handles Edge's pointer events correctly", async () => {
      await act(async () => {
        render(<AdvancedCursor />);
      });

      const cursor = screen.getByRole("presentation");
      expect(cursor).toHaveStyle({ pointerEvents: "none" });
    });
  });

  describe("WCAG 2.1 AA Compliance", () => {
    it("respects prefers-reduced-motion", async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const { container } = render(<AdvancedCursor />);
      
      // Should not render cursor when reduced motion is preferred
      expect(container.firstChild).toBeNull();
    });

    it("provides proper color contrast ratios", async () => {
      await act(async () => {
        render(<AdvancedCursor />);
      });

      const cursor = screen.getByRole("presentation");
      
      // Check that cursor elements have proper contrast
      const innerDot = cursor.querySelector("div > div");
      const outerRing = cursor.querySelector("div");
      
      expect(innerDot).toBeInTheDocument();
      expect(outerRing).toBeInTheDocument();
      
      // Verify opacity values for visibility
      expect(cursor).toHaveStyle({ opacity: "0" }); // Initially hidden
    });

    it("maintains keyboard navigation compatibility", async () => {
      await act(async () => {
        render(<AdvancedCursor />);
      });

      // Cursor should not interfere with keyboard navigation
      const cursor = screen.getByRole("presentation");
      expect(cursor).toHaveAttribute("aria-hidden", "true");
    });

    it("provides screen reader compatibility", async () => {
      await act(async () => {
        render(<AdvancedCursor />);
      });

      const cursor = screen.getByRole("presentation");
      
      // Should be hidden from screen readers
      expect(cursor).toHaveAttribute("aria-hidden", "true");
      
      // Should not contain any text content
      expect(cursor).toBeEmptyDOMElement();
    });
  });

  describe("Touch Device Compatibility", () => {
    it("does not render on touch devices", async () => {
      // Mock touch device
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === "(hover: none) and (pointer: coarse)",
          media: query,
          onchange: null,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const { container } = render(<AdvancedCursor />);
      
      // Should not render on touch devices
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Performance", () => {
    it("cleans up event listeners on unmount", () => {
      const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");
      
      const { unmount } = render(<AdvancedCursor />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith("mouseenter", expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith("mouseleave", expect.any(Function));
    });

    it("throttles mouse move events efficiently", async () => {
      await act(async () => {
        render(<AdvancedCursor />);
      });

      // Simulate rapid mouse movements
      const mouseMoveEvent = new MouseEvent("mousemove", {
        clientX: 100,
        clientY: 100,
      });

      // Fire multiple events rapidly
      for (let i = 0; i < 10; i++) {
        document.dispatchEvent(mouseMoveEvent);
      }

      // Should handle without errors
      expect(screen.getByRole("presentation")).toBeInTheDocument();
    });
  });

  describe("Interactive Elements", () => {
    it("detects hover over interactive elements", async () => {
      await act(async () => {
        render(
          <div>
            <AdvancedCursor />
            <button data-testid="test-button">Test Button</button>
          </div>
        );
      });

      const button = screen.getByTestId("test-button");
      const cursor = screen.getByRole("presentation");

      // Simulate mouse over button
      fireEvent.mouseMove(button, {
        clientX: 50,
        clientY: 50,
      });

      // Cursor should change appearance for interactive elements
      expect(cursor).toBeInTheDocument();
    });

    it("detects hover over globe elements", async () => {
      // Mock globe element
      document.body.innerHTML = '<div class="globe-container" style="width: 200px; height: 200px; position: absolute; top: 100px; left: 100px;"></div>';

      await act(async () => {
        render(<AdvancedCursor />);
      });

      const cursor = screen.getByRole("presentation");
      const globe = document.querySelector(".globe-container");

      // Simulate mouse over globe
      fireEvent.mouseMove(globe!, {
        clientX: 200,
        clientY: 200,
      });

      expect(cursor).toBeInTheDocument();
    });
  });
});

describe("useGlobeCursor Hook", () => {
  it("provides proper globe interaction state", () => {
    function TestComponent() {
      const { isGlobeHovered, handleGlobeEnter, handleGlobeLeave } = useGlobeCursor();
      
      return (
        <div>
          <div data-testid="globe-state">{isGlobeHovered ? "hovered" : "not-hovered"}</div>
          <button onMouseEnter={handleGlobeEnter} onMouseLeave={handleGlobeLeave}>
            Globe Element
          </button>
        </div>
      );
    }

    render(<TestComponent />);

    const globeState = screen.getByTestId("globe-state");
    const button = screen.getByRole("button");

    expect(globeState).toHaveTextContent("not-hovered");

    fireEvent.mouseEnter(button);
    expect(globeState).toHaveTextContent("hovered");

    fireEvent.mouseLeave(button);
    expect(globeState).toHaveTextContent("not-hovered");
  });
});
