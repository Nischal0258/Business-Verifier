import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CompanyStudentReport } from "@/types/student";

interface CompanyInfoCardProps {
  companyData: {
    company_name: string;
    is_verified: boolean;
    verification_score?: number;
    jurisdiction?: string;
    description?: string;
  };
  reviewSummary?: {
    overall_rating?: number | null;
    review_count?: number;
  };
}

export default function CompanyInfoCard({
  companyData,
  reviewSummary,
}: CompanyInfoCardProps) {
  return (
    <Card className="bg-white/[0.02] border border-white/10 rounded-2xl mb-12">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {companyData.company_name}
            </h1>
            <div className="flex items-center gap-4 text-sm font-medium">
              {companyData.is_verified ? (
                <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Verified Venture
                </Badge>
              ) : (
                <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 flex items-center gap-1.5">
                  <ShieldAlert size={16} /> Unverified
                </Badge>
              )}
              <span className="text-white/60 flex items-center gap-1.5">
                <MapPin size={16} className="text-[#64CEFB]" />
                {companyData.jurisdiction || "Global"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#A855F7]">
                {companyData.verification_score || 0}
              </div>
              <div className="text-xs uppercase tracking-widest text-white/50 mt-1">
                Trust Score
              </div>
            </div>
            {reviewSummary?.overall_rating && (
              <>
                <div className="w-px h-12 bg-white/10"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#64CEFB] flex items-center justify-center gap-1">
                    {reviewSummary.overall_rating.toFixed(1)}{" "}
                    <Star className="w-5 h-5 fill-[#64CEFB] text-[#64CEFB]" />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-white/50 mt-1">
                    {reviewSummary.review_count} Reviews
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {companyData.description && (
          <p className="text-white/70 leading-relaxed mt-6">
            {companyData.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
