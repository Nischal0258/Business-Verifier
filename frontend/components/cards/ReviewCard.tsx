import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Rating } from "@/components/ui/Rating";
import { User } from "lucide-react";
import type { InternalStudentReviewResponse } from "@/types/student";

interface ReviewCardProps {
  review: InternalStudentReviewResponse;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="bg-white/[0.02] border border-white/10 rounded-xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#64CEFB]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[#64CEFB]" />
            </div>
            <div>
              <h4 className="font-semibold text-white">{review.company_name}</h4>
              <p className="text-xs text-white/40">
                Posted {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Rating value={review.rating} readOnly size={16} />
        </div>
        {review.is_internship && (
          <p className="text-xs px-2 py-1 rounded bg-[#64CEFB]/10 text-[#64CEFB] border border-[#64CEFB]/20 inline-block mb-3">
            Internship
          </p>
        )}
        <p className="text-sm text-white/70 leading-relaxed">
          {review.review_text}
        </p>
      </CardContent>
    </Card>
  );
}
