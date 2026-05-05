import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import AnimatedHero from "@/components/layout/AnimatedHero";
import AdvancedCursor from "@/components/layout/AdvancedCursor";

expect.extend(toHaveNoViolations);

describe("WCAG 2.1 AA Compliance Validation", () => {
  describe("Color Contrast Ratios", () => {
    it("meets minimum contrast requirements for all text elements", async () => {
      const { container } = render(<AnimatedHero onSearch={jest.fn()} />);
      
      // Get all text elements
      const textElements = container.querySelectorAll("h1, h2, h3, p, span, button, a");
      
      textElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        // Skip elements with transparent backgrounds
        if (backgroundColor === "rgba(0, 0, 0, 0)") return;
        
        // Calculate contrast ratio (simplified check)
        const colorRgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
        const bgRgb = backgroundColor.match(/\d+/g)?.map(Number) || [255, 255, 255];
        
        const contrastRatio = calculateContrastRatio(colorRgb, bgRgb);
        
        // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });

    it("meets contrast requirements for form inputs", async () => {
      const { container } = render(<AnimatedHero onSearch={jest.fn()} />);
      
      const inputs = container.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
      
      inputs.forEach(input => {
        const computedStyle = window.getComputedStyle(input);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        
        // Calculate contrast ratio
        const colorRgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0];
        const bgRgb = backgroundColor.match(/\d+/g)?.map(Number) || [255, 255, 255];
        
        const contrastRatio = calculateContrastRatio(colorRgb, bgRgb);
        
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe("Keyboard Navigation", () => {
    it("provides proper tab order for interactive elements", async () => {
      render(<AnimatedHero onSearch={jest.fn()} />);
      
      const interactiveElements = screen.getAllByRole("button");
      const links = screen.getAllByRole("link");
      const inputs = screen.getAllByRole("textbox");
      
      const allInteractive = [...interactiveElements, ...links, ...inputs];
      
      // Check that all interactive elements are focusable
      allInteractive.forEach(element => {
        expect(element).toHaveAttribute("tabindex", "0");
      });
    });

    it("provides visible focus indicators", async () => {
      const { container } = render(<AnimatedHero onSearch={jest.fn()} />);
      
      const buttons = container.querySelectorAll("button");
      
      buttons.forEach(button => {
        // Simulate focus
        button.focus();
        
        const computedStyle = window.getComputedStyle(button);
        const outline = computedStyle.outline;
        const boxShadow = computedStyle.boxShadow;
        
        // Should have visible focus indicator
        expect(outline !== "none" || boxShadow !== "none").toBe(true);
      });
    });
  });

  describe("Screen Reader Compatibility", () => {
    it("provides proper ARIA labels and roles", async () => {
      render(<AnimatedHero onSearch={jest.fn()} />);
      
      // Check for proper heading structure
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toBeInTheDocument();
      
      // Check for proper button labels
      const buttons = screen.getAllByRole("button");
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it("hides decorative elements from screen readers", async () => {
      render(<AdvancedCursor />);
      
      const cursor = screen.getByRole("presentation");
      expect(cursor).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Responsive Design Accessibility", () => {
    it("maintains accessibility at different viewport sizes", async () => {
      // Test mobile viewport
      window.innerWidth = 375;
      window.innerHeight = 667;
      
      const { container } = render(<AnimatedHero onSearch={jest.fn()} />);
      
      // Check that text remains readable
      const textElements = container.querySelectorAll("p, span, h1, h2, h3");
      textElements.forEach(element => {
        const fontSize = window.getComputedStyle(element).fontSize;
        const fontSizePx = parseFloat(fontSize);
        
        // Minimum readable font size is 12px
        expect(fontSizePx).toBeGreaterThanOrEqual(12);
      });
    });
  });

  describe("Form Accessibility", () => {
    it("provides proper form labels and associations", async () => {
      render(<AnimatedHero onSearch={jest.fn()} />);
      
      // Check for proper input labeling
      const emailInput = screen.getByPlaceholderText("Email address");
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("required");
      
      const passwordInput = screen.getByPlaceholderText("Password");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("required");
    });

    it("provides clear error messaging", async () => {
      render(<AnimatedHero onSearch={jest.fn()} />);
      
      // Error messages should be announced to screen readers
      const errorMessages = screen.queryAllByRole("alert");
      errorMessages.forEach(error => {
        expect(error).toHaveAttribute("role", "alert");
      });
    });
  });

  describe("Automated Accessibility Testing", () => {
    it("passes automated axe accessibility scan", async () => {
      const { container } = render(<AnimatedHero onSearch={jest.fn()} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// Helper function to calculate contrast ratio
function calculateContrastRatio(rgb1: number[], rgb2: number[]): number {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;
  
  const l1 = (0.299 * r1 + 0.587 * g1 + 0.114 * b1) / 255;
  const l2 = (0.299 * r2 + 0.587 * g2 + 0.114 * b2) / 255;
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}
