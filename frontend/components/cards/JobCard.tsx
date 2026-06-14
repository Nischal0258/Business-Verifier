"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, IndianRupee, Clock, Building2, ExternalLink } from "lucide-react";
import type { OpportunityItem } from "@/types/student";

interface JobCardProps {
  job: OpportunityItem;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function JobCard({ job, isSelected, onClick }: JobCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all rounded-xl border ${
        isSelected
          ? "bg-white/10 border-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-white group-hover:text-[#64CEFB] transition-colors">
            {job.title}
          </h3>
          <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white/60" />
          </div>
        </div>

        <div className="text-[#A855F7] font-medium mb-3">
          {job.company_name || "Verified Company"}
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-white/60 mb-4">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-[#64CEFB]" />
            {job.location || "Remote"}
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase size={14} className="text-[#64CEFB]" />
            {job.type === "internship" ? "Internship" : "Full-Time"}
          </div>
          {job.stipend && (
            <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-0.5 rounded">
              <IndianRupee size={14} className="text-[#A855F7]" />
              {job.stipend}
            </div>
          )}
        </div>

        <div className="text-xs text-white/40 flex items-center gap-1">
          <Clock size={12} /> Posted recently
        </div>
      </CardContent>
    </Card>
  );
}
