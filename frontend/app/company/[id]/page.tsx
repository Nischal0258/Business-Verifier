import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, IndianRupee, ExternalLink, ShieldCheck, ShieldAlert, Star } from "lucide-react";

// Server-side fetching functions
async function getCompanyData(id: string) {
  try {
    const res = await fetch(`http://localhost:8000/api/verify/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Failed to fetch verify data", error);
    return null;
  }
}

async function getOpportunities(id: string) {
  try {
    const res = await fetch(`http://localhost:8000/api/company/${id}/opportunities`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.opportunities : [];
  } catch (error) {
    console.error("Failed to fetch opportunities", error);
    return [];
  }
}

async function getReviews(id: string) {
  try {
    const res = await fetch(`http://localhost:8000/api/company/${id}/reviews`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.reviews : null;
  } catch (error) {
    console.error("Failed to fetch reviews", error);
    return null;
  }
}

export default async function CompanyPage({ params }: { params: { id: string } }) {
  const companyId = decodeURIComponent(params.id);

  // Parallel data fetching for performance
  const [companyData, opportunities, reviews] = await Promise.all([
    getCompanyData(companyId),
    getOpportunities(companyId),
    getReviews(companyId)
  ]);

  if (!companyData) {
    return (
      <div className="bg-[#050508] min-h-screen flex items-center justify-center font-sans text-white">
        <div className="text-center">
          <h1 className="text-3xl mb-4 text-[#A855F7]">Company Not Found</h1>
          <p className="text-gray-400">We couldn&apos;t verify or find data for {companyId}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050508] min-h-screen font-sans text-white relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#64CEFB]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#A855F7]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="container mx-auto py-16 px-4 relative z-10 max-w-6xl">
        
        {/* Header / Verification Status */}
        <div className="liquid-glass border border-white/10 p-8 rounded-2xl mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">{companyData.company_name}</h1>
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
                <MapPin size={16} className="text-[#64CEFB]" /> {companyData.jurisdiction || "Global"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#A855F7]">{companyData.verification_score}</div>
              <div className="text-xs uppercase tracking-widest text-white/50 mt-1">Trust Score</div>
            </div>
            {reviews?.overall_rating && (
              <>
                <div className="w-px h-12 bg-white/10"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#64CEFB] flex items-center justify-center gap-1">
                    {reviews.overall_rating} <Star className="w-5 h-5 fill-[#64CEFB] text-[#64CEFB]" />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-white/50 mt-1">{reviews.review_count} Reviews</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Story & Verification */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-panel p-8 rounded-2xl border border-white/5">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-[#64CEFB] to-[#A855F7] rounded-full"></span>
                The Story
              </h2>
              <div className="text-white/70 leading-relaxed space-y-4 whitespace-pre-wrap">
                {companyData.company_history || "No extensive history is currently available for this venture."}
              </div>
            </div>

            {reviews?.student_verdict && (
              <div className="glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#A855F7]/10 rounded-full blur-[50px]"></div>
                <h2 className="text-xl font-semibold mb-4 text-[#A855F7]">VerifyIQ Student Verdict</h2>
                <p className="text-white/80 italic leading-relaxed text-lg">&quot;{reviews.student_verdict}&quot;</p>
              </div>
            )}
          </div>

          {/* Right Column: Opportunities */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-[#A855F7] to-[#64CEFB] rounded-full"></span>
              Open Opportunities
            </h2>
            
            {opportunities.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-white/40">
                No open roles currently listed.
              </div>
            ) : (
              opportunities.map((job: any, idx: number) => (
                <Card key={idx} className="glass-card-float cursor-pointer relative overflow-hidden group border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all rounded-xl">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#64CEFB]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-5">
                    <h3 className="font-bold text-white group-hover:text-[#64CEFB] transition-colors mb-3">{job.title}</h3>
                    
                    <div className="space-y-2 text-sm text-white/60 mb-5">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#A855F7]" /> {job.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-[#64CEFB]" /> {job.type === 'internship' ? 'Internship' : 'Full-Time'}
                      </div>
                      {job.stipend && (
                        <div className="flex items-center gap-2">
                          <IndianRupee size={14} className="text-[#A855F7]" /> {job.stipend}
                        </div>
                      )}
                    </div>
                    
                    <a href={job.apply_url || "#"} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-white/5 text-white hover:bg-white hover:text-black h-10 px-4">
                      Apply <ExternalLink className="ml-1.5 w-3.5 h-3.5" />
                    </a>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
