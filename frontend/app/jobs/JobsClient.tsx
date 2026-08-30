"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, IndianRupee, ExternalLink, Clock } from "lucide-react";
import JobCard from "@/components/cards/JobCard";
import FilterSidebar from "@/components/filters/FilterSidebar";
import type { OpportunityItem } from "@/types/student";

export default function JobsClient({ initialJobs }: { initialJobs: OpportunityItem[] }) {
  const [selectedJob, setSelectedJob] = useState<OpportunityItem | null>(
    initialJobs.length > 0 ? initialJobs[0] : null
  );
  const [filteredJobs, setFilteredJobs] = useState(initialJobs);

  return (
    <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
      {/* Filter Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <FilterSidebar
          onFilterChange={(filters) => {
            // Simple filtering logic for demo
            let filtered = [...initialJobs];
            if (filters.location) {
              filtered = filtered.filter((j) =>
                j.location.toLowerCase().includes(filters.location?.toLowerCase() || "")
              );
            }
            if (filters.jobType) {
              filtered = filtered.filter((j) => j.type === filters.jobType);
            }
            setFilteredJobs(filtered);
          }}
        />
      </div>

      {/* Jobs List */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar h-full pb-20">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["Remote", "Full-Time", "Internship", "Entry Level"].map((filter) => (
            <button
              key={filter}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
            >
              {filter}
            </button>
          ))}
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-white/40 mt-4">
            No jobs found matching your criteria.
          </div>
        ) : (
          filteredJobs.map((job) => (
            <JobCard
              key={job.id || job.title}
              job={job}
              isSelected={selectedJob?.id === job.id}
              onClick={() => setSelectedJob(job)}
            />
          ))
        )}
      </div>

      {/* Selected Job Details (Right Pane) */}
      <div className="hidden lg:flex w-full lg:w-1/3 flex-1 h-full">
        {selectedJob ? (
          <div className="w-full h-full bg-white/[0.02] border border-white/10 rounded-2xl p-8 overflow-y-auto custom-scrollbar shadow-xl relative">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-6 mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">{selectedJob.title}</h2>
                <div className="text-xl text-[#A855F7] mb-4">
                  {selectedJob.company_name || "Verified Company"}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-white/70">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-[#64CEFB]" />
                    {selectedJob.location || "Remote"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={16} className="text-[#64CEFB]" />
                    {selectedJob.type === "internship" ? "Internship" : "Full-Time"}
                  </div>
                  {selectedJob.stipend && (
                    <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-0.5 rounded">
                      <IndianRupee size={14} className="text-[#A855F7]" />
                      {selectedJob.stipend}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href={selectedJob.apply_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-xl font-bold transition-colors flex items-center justify-center whitespace-nowrap shadow-lg shadow-[#A855F7]/25"
                >
                  Apply Now <ExternalLink className="ml-2 w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-semibold mb-4 text-white">Job Description</h3>
              <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
                {selectedJob.description ||
                  "We are looking for a talented individual to join our verified team. As part of this role, you will be responsible for driving impact, collaborating with cross-functional teams, and building scalable solutions. \n\nRequirements:\n- Strong problem-solving skills\n- Ability to work in a fast-paced environment\n- Excellent communication skills\n\nJoin us to build the future."}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center text-white/40">
            Select a job from the list to view details
          </div>
        )}
      </div>
    </div>
  );
}
