import React from "react";
import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  max?: number;
  size?: number;
  color?: string;
  onRate?: (rating: number) => void;
  readOnly?: boolean;
}

export function Rating({
  value,
  max = 5,
  size = 20,
  color = "text-[#64CEFB]",
  onRate,
  readOnly = false,
}: RatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  return (
    <div className="flex gap-1">
      {[...Array(max)].map((_, idx) => {
        const starValue = idx + 1;
        const isFilled = (hoverValue !== null ? hoverValue : value) >= starValue;

        return (
          <Star
            key={starValue}
            size={size}
            className={`${isFilled ? `${color} fill-current` : "text-white/20"} ${
              !readOnly && onRate ? "cursor-pointer transition-transform hover:scale-110" : ""
            }`}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            onClick={() => !readOnly && onRate?.(starValue)}
          />
        );
      })}
    </div>
  );
}
