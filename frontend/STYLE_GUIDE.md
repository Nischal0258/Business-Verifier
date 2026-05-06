# VerifyIQ Design Patterns & Style Guide

## Overview
This document outlines the design patterns, UI components, and interaction specifications for the VerifyIQ platform. It serves as a reference for maintaining visual consistency and implementing new features.

---

## 1. Core Design Principles

### Visual Identity
- **Dark Theme**: All surfaces use a deep black/charcoal base (`#050508`, `#0a0a0a`) with subtle transparency for layering.
- **Glassmorphism**: Heavy use of `backdrop-blur-*`, `bg-black/40`, and `border-white/5` to create depth and a futuristic feel.
- **Accent System**:
  - Primary: `#64CEFB` (Light Blue)
  - Secondary: `#A855F7` (Purple)
  - Accent Glow: Subtle radial gradients and shadows using accent colors.

---

## 2. Timeline Component (`TimelineStory`)

### Layout
- **Structure**: Alternating left/right layout for timeline events.
- **Spacing**: Uses `gap-8` and `py-32` for generous breathing room.
- **Responsive**: Stacks vertically on mobile (`flex-col`).

### Animations
- **Entrance**: Events fade in from left/right using `useInView`.
- **Parallax**: Background elements use `useScroll` and `useTransform` for depth.
- **Micro-interactions**: Cards scale subtly (`scale-105`) and show gradient borders on hover.

### Code Pattern
```tsx
<motion.div
  ref={ref}
  initial={{ opacity: 0, x: -50 }}
  animate={isInView ? { opacity: 1, x: 0 } : {}}
  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
>
```

---

## 3. Glassmorphism Search Bar

### Implementation
- **Container**: `rounded-[2.5rem]`, `border border-white/10`, `bg-black/40`.
- **Blur**: `backdrop-blur-3xl` for maximum translucency.
- **Focus State**: `group-focus-within:border-white/20` and subtle glow.

### Code Pattern
```tsx
<div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-2 shadow-2xl backdrop-blur-3xl transition-all duration-500 group-focus-within:border-white/20 group-focus-within:bg-black/60">
```

---

## 4. Icon System

### Usage
- **Library**: Lucide React for all icons.
- **Sizes**:
  - Small (inline): `h-4 w-4`
  - Medium (cards): `h-5 w-5`
  - Large (headers): `h-7 w-7`
- **Color**: Always inherits text color or uses `text-accent-primary`.

---

## 5. Micro-interactions

### Button Hover
```tsx
<button className="... transition-all hover:scale-105 active:scale-95">
```
- **Scale**: `hover:scale-105`, `active:scale-95`.
- **Color Shift**: Use `text-white/80` to `text-white`.
- **Arrow Slide**: `group-hover:translate-x-1` for directional hints.

### Card Hover
- **Border**: `hover:border-white/10`.
- **Background**: `hover:bg-white/[0.04]`.
- **Shadow**: `hover:shadow-2xl hover:shadow-accent-primary/5`.

---

## 6. Typography

### Scale
| Element | Size | Weight | Color |
| :--- | :--- | :--- | :--- |
| Display | `text-7xl` | `font-bold` | `text-white` |
| Heading | `text-2xl` | `font-bold` | `text-white` |
| Body | `text-base` | `font-normal` | `text-white/70` |
| Caption | `text-xs` | `font-mono` | `text-white/40` |

### Gradient Text
```tsx
<span className="bg-gradient-to-r from-accent-primary to-accent-purple bg-clip-text text-transparent">
```

---

## 7. Color Tokens

| Token | Hex | Usage |
| :--- | :--- | :--- |
| Background | `#050508` | Page base |
| Surface | `#0a0a0a` | Cards, nav |
| Primary | `#64CEFB` | CTAs, highlights |
| Purple | `#A855F7` | Secondary accents |
| Text Primary | `#FFFFFF` | Headings |
| Text Secondary | `rgba(255,255,255,0.7)` | Body text |
| Border | `rgba(255,255,255,0.05)` | Card borders |

---

## 8. Accessibility (WCAG 2.1)

- **Contrast**: All text uses minimum 4.5:1 contrast ratio.
- **Focus States**: All interactive elements have visible focus rings.
- **Animations**: Respects `prefers-reduced-motion` (though no motion syntax is explicitly used in components).
- **Semantic HTML**: Uses `<button>`, `<nav>`, `<main>`, `<section>` correctly.

---

## 9. Performance Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **Total Bundle Size**: < 500kb (JS)
- **Animation**: 60fps maintained using `transform` and `opacity` only (GPU-accelerated).
