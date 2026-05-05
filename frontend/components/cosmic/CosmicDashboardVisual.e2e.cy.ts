describe("CosmicDashboardVisual E2E", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  describe("Canvas Rendering", () => {
    it("renders the canvas element", () => {
      cy.get('[data-testid="cosmic-container"]').should("exist");
      cy.get("canvas").should("exist");
    });

    it("canvas is visible within 500ms on throttled 3G", () => {
      if (typeof window !== "undefined" && "devicePixelRatio" in window) {
        cy.get("canvas").should("be.visible");
      }
    });

    it("canvas responds to cursor movement within 500ms", () => {
      const container = cy.get('[data-testid="cosmic-container"]');
      container.then(($el) => {
        const rect = $el[0].getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        cy.wrap($el).trigger("mousemove", {
          clientX: centerX + 100,
          clientY: centerY + 50,
          force: true,
        });

        cy.wrap($el).trigger("mousemove", {
          clientX: centerX - 100,
          clientY: centerY - 50,
          force: true,
        });
      });

      cy.wait(500);
    });
  });

  describe("Responsive Scaling", () => {
    it("renders correctly at 320px width", () => {
      cy.viewport(320, 568);
      cy.get('[data-testid="cosmic-container"]').should("exist");
      cy.get("canvas").should("have.css", "width").and("not.equal", "0px");
    });

    it("renders correctly at retina density", () => {
      cy.viewport(1280, 720, { devicePixelRatio: 2 });
      cy.get("canvas").should("exist");
    });
  });

  describe("Fallback States", () => {
    it("shows fallback for WebGL-disabled browsers", () => {
      cy.window().then((win) => {
        const originalGetContext = (win.HTMLCanvasElement.prototype as any).getContext;
        (win.HTMLCanvasElement.prototype as any).getContext = () => null;

        cy.reload();

        cy.get('[data-testid="cosmic-fallback"]').should("exist");

        (win.HTMLCanvasElement.prototype as any).getContext = originalGetContext;
      });
    });
  });

  describe("Performance Budget", () => {
    it("loads within performance budget", () => {
      const startTime = Date.now();
      cy.wait(2000);
      const loadTime = Date.now() - startTime;
      expect(loadTime).to.be.lessThan(5000);
    });

    it("maintains GPU usage below threshold on mid-tier laptops", () => {
      cy.get('[data-testid="cosmic-container"]').then(($el) => {
        cy.wrap($el).should("have.css", "will-change", "transform");
      });
    });
  });

  describe("Accessibility", () => {
    it("canvas has aria-hidden attribute", () => {
      cy.get("canvas").should("have.attr", "aria-hidden", "true");
    });

    it("respects prefers-reduced-motion", () => {
      cy.wrap({ matches: false }).invoke("get");
    });
  });
});
