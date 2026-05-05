import type { Meta, StoryObj } from "@storybook/react";
import CosmicDashboardVisual from "./CosmicDashboardVisual";

const meta: Meta<typeof CosmicDashboardVisual> = {
  title: "Cosmic/DashboardVisual",
  component: CosmicDashboardVisual,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Space-themed dashboard visual with particle effects, nebula gradients, and mouse parallax. Falls back gracefully for WebGL-disabled browsers and respects reduced motion preferences.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes for the container",
    },
    reducedMotion: {
      control: "boolean",
      description: "Disable animations for accessibility (respects prefers-reduced-motion)",
    },
    config: {
      control: "object",
      description: "Configuration options for the cosmic visual",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CosmicDashboardVisual>;

export const Default: Story = {
  args: {
    className: "w-full h-[600px]",
  },
};

export const ReducedMotion: Story = {
  args: {
    className: "w-full h-[600px]",
    reducedMotion: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Visual with all animations disabled for users who prefer reduced motion.",
      },
    },
  },
};

export const LowIntensity: Story = {
  args: {
    className: "w-full h-[600px]",
    config: {
      particleCount: 1000,
      nebulaIntensity: 0.4,
      blurLevel: 80,
      mouseParallaxStrength: 0.01,
      rotationSpeed: 0.0001,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Lower intensity settings for better performance on mid-tier devices.",
      },
    },
  },
};

export const HighIntensity: Story = {
  args: {
    className: "w-full h-[600px]",
    config: {
      particleCount: 5000,
      nebulaIntensity: 1.0,
      blurLevel: 40,
      mouseParallaxStrength: 0.03,
      rotationSpeed: 0.0005,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "High intensity settings for premium hardware experiences.",
      },
    },
  },
};

export const AsBackground: Story = {
  args: {
    className: "w-full h-screen",
  },
  parameters: {
    docs: {
      description: {
        story: "Full-screen cosmic background usage example.",
      },
    },
  },
};
