# Component Documentation

## Overview
This document describes all reusable components in the frontend codebase.

---

## UI Components
### `Rating` (`/components/ui/Rating.tsx`)

A customizable interactive star‑rating component.

#### Props
| Prop         | Type       | Default  | Description                                  |
|--------------|------------|----------|----------------------------------------------|
| `value`      | `number`   | required | Current rating (0‑`max`)                     |
| `max`        | `number`   | `5`      | Max stars                                    |
| `size`       | `number`   | `20`     | Icon size                                    |
| `color`      | `string`   | `text-[#64CEFB]` | Star color                                |
| `onRate`     | `(rating: number) => void` | `undefined` | Callback when rating changes (interactive only) |
| `readOnly`   | `boolean`  | `false`  | If true, rating isn't interactive            |

#### Usage Example
```tsx
import { Rating } from "@/components/ui/Rating";

function ReviewForm() {
  const [rating, setRating] = useState(4);
  return (
    <Rating value={rating} onRate={setRating} />
  );
}
```

---

## Cards

### `JobCard` (`/components/cards/JobCard.tsx`)

Displays a single job/opportunity in a card.

#### Props
| Prop           | Type             | Default  | Description                                  |
|----------------|------------------|----------|----------------------------------------------|
| `job`          | `OpportunityItem` | required | Job data object                              |
| `isSelected`   | `boolean`        | `false`  | If true, applies active border style         |
| `onClick`      | `() => void`     | `undefined` | Called when card is clicked                |

#### Usage Example
```tsx
import JobCard from "@/components/cards/JobCard";

function JobList({ jobs }) {
  return <div>{jobs.map((job) => <JobCard key={job.id} job={job} />)}</div>;
}
```

---

### `ReviewCard` (`/components/cards/ReviewCard.tsx`)

Shows a single student review for a company.

#### Props
| Prop       | Type                        | Default  | Description |
|------------|-----------------------------|----------|-------------|
| `review`   | `InternalStudentReviewResponse` | required | Review data |

---

### `CompanyInfoCard` (`/components/cards/CompanyInfoCard.tsx`)

Company header card, showing verification status, trust score, ratings.

#### Props
| Prop             | Type                     | Default  | Description                                  |
|------------------|--------------------------|----------|----------------------------------------------|
| `companyData`    | `any`                    | required | Company details                              |
| `reviewSummary`  | `CompanyReviewSummary`   | `undefined` | Optional aggregated review data |

---

## Filters

### `FilterSidebar` (`/components/filters/FilterSidebar.tsx`)

Left/top sidebar for filtering jobs (location, job type).

#### Props
| Prop             | Type                                           | Default  | Description                                  |
|------------------|------------------------------------------------|----------|----------------------------------------------|
| `onFilterChange` | `(filters: {location?: string; jobType?: string}) => void` | `undefined` | Called when filters change |

---
