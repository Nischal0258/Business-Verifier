"use client";

import React from "react";

interface FilterSidebarProps {
  onFilterChange?: (filters: {
    location?: string;
    jobType?: string;
    search?: string;
  }) => void;
}

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [location, setLocation] = React.useState("");
  const [jobType, setJobType] = React.useState("");

  const handleChange = () => {
    onFilterChange?.({ location, jobType });
  };

  React.useEffect(() => {
    handleChange();
  }, [location, jobType]);

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sticky top-8 h-fit">
      <h3 className="text-xl font-bold mb-6 text-white">Filters</h3>

      <div className="mb-6">
        <label className="block text-sm font-medium text-white/60 mb-2">
          Location
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Remote, New York, etc."
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#64CEFB]"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-white/60 mb-3">
          Job Type
        </label>
        <div className="flex flex-col gap-2">
          {["All", "Internship", "Full-Time", "Part-Time"].map((type) => (
            <label
              key={type}
              className="flex items-center gap-3 text-white/70 cursor-pointer"
            >
              <input
                type="radio"
                name="jobType"
                value={type === "All" ? "" : type.toLowerCase()}
                checked={jobType === (type === "All" ? "" : type.toLowerCase())}
                onChange={(e) => setJobType(e.target.value)}
                className="accent-[#A855F7]"
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          setLocation("");
          setJobType("");
        }}
        className="w-full py-2 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
}
