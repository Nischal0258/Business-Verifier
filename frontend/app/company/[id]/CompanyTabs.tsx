"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, IndianRupee, ExternalLink } from "lucide-react";
import JobCard from "@/components/cards/JobCard";
import ReviewCard from "@/components/cards/ReviewCard";
import type { OpportunityItem, InternalStudentReviewResponse, CompanyReviewSummary } from "@/types/student";

export default function CompanyTabs({
  companyData,
  opportunities,
  reviews,
  internalReviews = [],
}: {
  companyData: any;
  opportunities: OpportunityItem[];
  reviews?: CompanyReviewSummary | null;
  internalReviews?: InternalStudentReviewResponse[];
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "jobs", label: "Jobs" },
    { id: "reviews", label: "Reviews & Verdict" },
  ];

  return (
    <div className="mt-8">
      {/* Tab Navigation */}
      <div className="flex items-center gap-8 border-b border-white/10 mb-8 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-lg font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab.id
                ? "text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#A855F7] to-[#64CEFB]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-panel p-8 rounded-2xl border border-white/5">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-[#64CEFB] to-[#A855F7] rounded-full"></span>
                The Story
              </h2>
              <div className="text-white/70 leading-relaxed space-y-4 whitespace-pre-wrap">
                {companyData.company_history ||
                  "No extensive history is currently available for this venture."}
              </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl border border-white/5">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-[#64CEFB] to-[#A855F7] rounded-full"></span>
                Key Details
              </h2>
              <ul className="text-white/70 space-y-3">
                <li><strong>Jurisdiction:</strong> {companyData.jurisdiction || "N/A"}</li>
                <li><strong>Verification Score:</strong> {companyData.verification_score || "N/A"}</li>
                <li><strong>Status:</strong> {companyData.is_verified ? "Verified" : "Unverified"}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-[#A855F7] to-[#64CEFB] rounded-full"></span>
              Open Opportunities
            </h2>

            {opportunities.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-white/40">
                No open roles currently listed.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((job) => (
                  <JobCard key={job.id || job.title} job={job} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {reviews?.student_verdict ? (
              <div className="glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#A855F7]/10 rounded-full blur-[50px]"></div>
                <h2 className="text-xl font-semibold mb-4 text-[#A855F7]">
                  VerifyIQ Student Verdict
                </h2>
                <p className="text-white/80 italic leading-relaxed text-lg">
                  &quot;{reviews.student_verdict}&quot;
                </p>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-white/40">
                No reviews or verdict available yet.
              </div>
            )}

            {reviews?.overall_rating && (
              <div className="glass-panel p-8 rounded-2xl border border-white/5">
                <h2 className="text-xl font-semibold mb-4">
                  Overall Rating: {reviews.overall_rating} / 5
                </h2>
                <p className="text-white/60">
                  Based on {reviews.review_count} reviews from employees and candidates.
                </p>
              </div>
            )}

            {internalReviews.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Student Reviews</h3>
                {internalReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
