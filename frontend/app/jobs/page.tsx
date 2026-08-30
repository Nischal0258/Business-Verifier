import React from "react";
import JobsClient from "./JobsClient";

async function getJobs(query?: string, location?: string) {
  try {
    const url = new URL("http://localhost:8000/api/v1/students/opportunities");
    if (query) url.searchParams.append("search", query);
    if (location) url.searchParams.append("location", location);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch jobs", error);
    return [];
  }
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { q?: string; loc?: string };
}) {
  const jobs = await getJobs(searchParams.q, searchParams.loc);

  return (
    <div className="bg-[#050508] min-h-screen font-sans text-white relative flex flex-col">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#64CEFB]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#A855F7]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Content Area */}
      <div className="flex-1 container mx-auto px-4 py-8 relative z-10 max-w-7xl flex flex-col h-screen">
        <h1 className="text-3xl font-bold mb-6">
          Job Search Results {searchParams.q && `for "${searchParams.q}"`}
        </h1>
        
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          <JobsClient initialJobs={jobs} />
        </div>
      </div>
    </div>
  );
}
