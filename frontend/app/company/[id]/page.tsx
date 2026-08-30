import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, IndianRupee, ExternalLink, ShieldCheck, ShieldAlert, Star } from "lucide-react";
import CompanyTabs from "./CompanyTabs";

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
    const res = await fetch(`http://localhost:8000/api/v1/companies/${id}/opportunities`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Failed to fetch opportunities", error);
    return [];
  }
}

async function getReviews(id: string) {
  try {
    const res = await fetch(`http://localhost:8000/api/v1/companies/${id}/reviews`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
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

        {/* Tabbed Interface Layout */}
        <CompanyTabs 
          companyData={companyData} 
          opportunities={opportunities} 
          reviews={reviews} 
        />
      </div>
    </div>
  );
}
