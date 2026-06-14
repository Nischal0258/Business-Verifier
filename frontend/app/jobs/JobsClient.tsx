"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, IndianRupee, ExternalLink, Building, Clock, Building2 } from "lucide-react";

export default function JobsClient({ initialJobs }: { initialJobs: any[] }) {
  const [selectedJob, setSelectedJob] = useState<any | null>(initialJobs.length > 0 ? initialJobs[0] : null);

  return (
    <>
      {/* Filters & Options (Top/Sidebar area - left) */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar h-full pb-20">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['Remote', 'Full-Time', 'Internship', 'Entry Level'].map(filter => (
            <button key={filter} className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors">
              {filter}
            </button>
          ))}
        </div>

        {initialJobs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-white/40 mt-4">
            No jobs found matching your criteria.
          </div>
        ) : (
          initialJobs.map((job: any, idx: number) => (
            <Card 
              key={idx} 
              onClick={() => setSelectedJob(job)}
              className={`cursor-pointer transition-all rounded-xl border ${
                selectedJob === job 
                  ? "bg-white/10 border-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.3)]" 
                  : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-white group-hover:text-[#64CEFB] transition-colors">{job.title}</h3>
                  <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white/60" />
                  </div>
                </div>
                
                <div className="text-[#A855F7] font-medium mb-3">{job.company_name || "Verified Company"}</div>
                
                <div className="flex flex-wrap gap-3 text-sm text-white/60 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#64CEFB]" /> {job.location || "Remote"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={14} className="text-[#64CEFB]" /> {job.type === 'internship' ? 'Internship' : 'Full-Time'}
                  </div>
                </div>

                <div className="text-xs text-white/40 flex items-center gap-1">
                  <Clock size={12} /> Posted recently
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Selected Job Details (Right Pane) */}
      <div className="hidden lg:flex w-full lg:w-2/3 h-full">
        {selectedJob ? (
          <div className="w-full h-full bg-white/[0.02] border border-white/10 rounded-2xl p-8 overflow-y-auto custom-scrollbar shadow-xl relative">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-6 mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">{selectedJob.title}</h2>
                <div className="text-xl text-[#A855F7] mb-4">{selectedJob.company_name || "Verified Company"}</div>
                
                <div className="flex flex-wrap gap-4 text-sm text-white/70">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-[#64CEFB]" /> {selectedJob.location || "Remote"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={16} className="text-[#64CEFB]" /> {selectedJob.type === 'internship' ? 'Internship' : 'Full-Time'}
                  </div>
                  {selectedJob.stipend && (
                    <div className="flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-0.5 rounded">
                      <IndianRupee size={14} className="text-[#A855F7]" /> {selectedJob.stipend}
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
                {selectedJob.description || "We are looking for a talented individual to join our verified team. As part of this role, you will be responsible for driving impact, collaborating with cross-functional teams, and building scalable solutions. \n\nRequirements:\n- Strong problem-solving skills\n- Ability to work in a fast-paced environment\n- Excellent communication skills\n\nJoin us to build the future."}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center text-white/40">
            Select a job from the list to view details
          </div>
        )}
      </div>

      {/* Mobile Selected Job Modal (Visible only on small screens) */}
      {/* omitted for brevity, but would be a fixed overlay */}
    </>
  );
}
