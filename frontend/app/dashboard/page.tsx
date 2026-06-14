"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, IndianRupee, Star, ExternalLink, ChevronDown, Building2, Award, BriefcaseBusiness, Compass, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/components/ui/FadeIn";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import OnboardingModal from "@/components/OnboardingModal";
import JobDetailsDrawer from "@/components/JobDetailsDrawer";

interface TopCompanyCategory {
  category: string;
  count: string;
  companies: string[];
}

interface FeaturedCompany {
  name: string;
  rating: number;
  reviews_count: string;
  description: string;
  tags: string[];
}

interface ExploreOpportunity {
  title: string;
  company_name: string;
  location: string;
  type: string;
  stipend: string | null;
  duration: string | null;
  skills_required: string[];
  apply_url: string | null;
  source: string;
  company_tier?: string;
  trust_score?: number;
}

// Quick filter pills data
const QUICK_FILTERS = [
  { icon: <MapPin size={16}/>, label: "Remote" },
  { icon: <Building2 size={16}/>, label: "MNC" },
  { icon: <Award size={16}/>, label: "Startup" },
  { icon: <BriefcaseBusiness size={16}/>, label: "Internship" },
  { icon: <IndianRupee size={16}/>, label: "Paid" },
];

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [opportunities, setOpportunities] = useState<ExploreOpportunity[]>([]);
  const [topCompanies, setTopCompanies] = useState<TopCompanyCategory[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<FeaturedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const [topEmblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [Autoplay({ delay: 3000, stopOnInteraction: false })]);
  const [featEmblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [Autoplay({ delay: 4000, stopOnInteraction: false })]);

  const fetchOpportunities = async (searchQuery = query) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (location) params.append('location', location);
      
      const res = await fetch(`http://localhost:8000/api/explore?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setOpportunities(data.opportunities || []);
        if (data.top_companies) setTopCompanies(data.top_companies);
        if (data.featured_companies) setFeaturedCompanies(data.featured_companies);
      }
    } catch (err) {
      console.error("Error fetching opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-[#050508] min-h-screen font-sans text-white">
      {/* HERO SECTION */}
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 flex flex-col min-h-screen w-full">
          {/* Mega Navbar */}
          <div className="w-full px-6 md:px-12 lg:px-16 pt-6">
            <nav className="liquid-glass border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between relative bg-black/20 backdrop-blur-md">
              <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Student Hub</div>
              
              <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                <div 
                  className="relative group"
                  onMouseEnter={() => setActiveMenu('jobs')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <button className="flex items-center gap-1 hover:text-[#9fff00] transition-colors py-2 text-white">
                    Jobs <ChevronDown size={14} className={`transition-transform ${activeMenu === 'jobs' ? 'rotate-180' : ''}`} />
                  </button>
                  {/* Dropdown */}
                  <AnimatePresence>
                    {activeMenu === 'jobs' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-[#0A0A0A] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl"
                      >
                        <div className="space-y-2">
                          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Popular Categories</p>
                          <Link href="#explore-section" className="block text-white/80 hover:text-[#9fff00] hover:translate-x-1 transition-all py-1.5">IT Jobs</Link>
                          <Link href="#explore-section" className="block text-white/80 hover:text-[#9fff00] hover:translate-x-1 transition-all py-1.5">Sales Jobs</Link>
                          <Link href="#explore-section" className="block text-white/80 hover:text-[#9fff00] hover:translate-x-1 transition-all py-1.5">Marketing Jobs</Link>
                          <Link href="#explore-section" className="block text-white/80 hover:text-[#9fff00] hover:translate-x-1 transition-all py-1.5">Data Science Jobs</Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div 
                  className="relative group"
                  onMouseEnter={() => setActiveMenu('companies')}
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <button className="flex items-center gap-1 hover:text-[#9fff00] transition-colors py-2 text-white">
                    Companies <ChevronDown size={14} className={`transition-transform ${activeMenu === 'companies' ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {activeMenu === 'companies' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-[#0A0A0A] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl"
                      >
                        <div className="space-y-2">
                          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Explore Collections</p>
                          <Link href="#explore-section" className="block text-white/80 hover:text-[#9fff00] hover:translate-x-1 transition-all py-1.5">Top MNCs</Link>
                          <Link href="#explore-section" className="block text-white/80 hover:text-[#9fff00] hover:translate-x-1 transition-all py-1.5">Startups</Link>
                          <Link href="#explore-section" className="block text-white/80 hover:text-[#9fff00] hover:translate-x-1 transition-all py-1.5">Product Based</Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <Link href="/feedback" className="hover:text-[#9fff00] transition-colors py-2 text-white">Feedback</Link>
                <Link href="/community" className="hover:text-[#9fff00] transition-colors py-2 text-white">Community</Link>
              </div>

              <div className="flex gap-4">
                <Link href="/chat" className="bg-[#9fff00] text-black px-6 py-2.5 rounded-xl font-bold hover:bg-[#8cee00] transition-all transform hover:scale-105 text-sm shadow-[0_0_20px_rgba(159,255,0,0.3)]">
                  Start Chat
                </Link>
              </div>
            </nav>
          </div>

          {/* Hero Content */}
          <div className="px-6 md:px-12 lg:px-16 flex-1 flex flex-col justify-center items-center pb-12 lg:pb-16 w-full text-center mt-[-5vh]">
            <AnimatedHeading
              text={"Find your dream job now"}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white tracking-tight"
            />
            <FadeIn delay={600} duration={800}>
              <p className="text-lg md:text-xl text-white/80 mb-12 font-medium max-w-2xl mx-auto">
                Explore thousands of verified opportunities, driven by AI.
              </p>
            </FadeIn>
            
            {/* Massive Pill Search Bar */}
            <FadeIn delay={1000} duration={800} className="w-full max-w-4xl mx-auto">
              <div className="bg-white/[0.08] backdrop-blur-xl border border-white/20 p-2 rounded-3xl md:rounded-full flex flex-col md:flex-row shadow-2xl items-center ring-1 ring-white/10">
                <div className="flex-1 flex items-center px-6 border-b md:border-b-0 md:border-r border-white/20 w-full md:w-auto h-16">
                  <Compass className="text-white/60 mr-3 hidden sm:block" size={22} />
                  <Input 
                    placeholder="Enter skills / designations / companies" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchOpportunities()}
                    className="bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-white/60 text-base lg:text-lg h-full px-0 shadow-none w-full"
                  />
                </div>
                <div className="flex-1 flex items-center px-6 w-full md:w-auto h-16">
                  <MapPin className="text-white/60 mr-3 hidden sm:block" size={22} />
                  <Input 
                    placeholder="Enter location" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchOpportunities()}
                    className="bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-white/60 text-base lg:text-lg h-full px-0 shadow-none w-full"
                  />
                </div>
                <Button 
                  onClick={() => {
                    fetchOpportunities();
                    document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#9fff00] hover:bg-[#8cee00] text-black rounded-2xl md:rounded-full px-12 h-14 font-bold text-lg w-full md:w-auto m-1 transition-all shadow-[0_0_20px_rgba(159,255,0,0.2)]">
                  Search
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* EXPLORE REDESIGN SECTION */}
      <div id="explore-section" className="py-24 w-full max-w-7xl mx-auto px-6 space-y-24">
        
        {/* Quick Filters */}
        <section>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {QUICK_FILTERS.map((filter, i) => (
              <button 
                key={i}
                onClick={() => fetchOpportunities(filter.label)}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all font-medium text-white/80 hover:text-white"
              >
                {filter.icon}
                {filter.label} <ChevronDown size={14} className="ml-1 opacity-40" />
              </button>
            ))}
          </div>
        </section>

        {/* Top Companies Hiring Now (Carousel) */}
        <section>
          <div className="flex items-center justify-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-white">Top companies hiring now</h2>
          </div>
          <div className="overflow-hidden" ref={topEmblaRef}>
            <div className="flex -ml-4">
              {topCompanies.length > 0 ? topCompanies.map((tc, idx) => (
                <div key={idx} className="flex-[0_0_80%] sm:flex-[0_0_40%] md:flex-[0_0_25%] pl-4 min-w-0">
                  <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 h-full hover:border-[#9fff00]/50 transition-colors group cursor-pointer shadow-lg" onClick={() => fetchOpportunities(tc.category)}>
                    <h3 className="text-xl font-bold mb-1 group-hover:text-[#9fff00] transition-colors">{tc.category} <ArrowRight size={16} className="inline opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-1 transition-all" /></h3>
                    <p className="text-sm text-white/50 mb-6">{tc.count} are actively hiring</p>
                    <div className="flex gap-2 flex-wrap">
                      {tc.companies.slice(0,4).map(c => (
                        <div key={c} className="w-10 h-10 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center text-xs font-bold text-white/80" title={c}>
                          {c[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )) : (
                [1,2,3,4].map(i => (
                  <div key={i} className="flex-[0_0_25%] pl-4 min-w-0"><div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 h-36 animate-pulse"></div></div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Featured Companies (Carousel) */}
        <section>
          <div className="flex items-center justify-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-white">Featured companies actively hiring</h2>
          </div>
          <div className="overflow-hidden pb-8" ref={featEmblaRef}>
            <div className="flex -ml-6">
              {featuredCompanies.length > 0 ? featuredCompanies.map((fc, idx) => (
                <div key={idx} className="flex-[0_0_90%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] pl-6 min-w-0">
                  <Card className="bg-[#0A0A0A] border-white/10 rounded-2xl hover:bg-[#0f0f0f] hover:border-white/20 transition-all cursor-pointer h-full group shadow-xl" onClick={() => fetchOpportunities(fc.name)}>
                    <CardContent className="p-8">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent mb-6 flex items-center justify-center text-2xl font-bold shadow-inner border border-white/10 text-[#9fff00]">
                        {fc.name.substring(0, 2).toUpperCase()}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{fc.name}</h3>
                      <div className="flex items-center gap-2 text-sm mb-5 bg-white/5 inline-flex px-3 py-1 rounded-full">
                        <Star className="text-yellow-400 fill-yellow-400 w-3.5 h-3.5" />
                        <span className="font-bold">{fc.rating}</span>
                        <span className="text-white/30">|</span>
                        <span className="text-white/60">{fc.reviews_count}</span>
                      </div>
                      <p className="text-white/60 mb-8 line-clamp-2 h-10 leading-relaxed text-sm">{fc.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {fc.tags.map(t => (
                          <Badge key={t} variant="secondary" className="bg-[#111] hover:bg-[#222] text-white/70 font-medium border border-white/5 px-3 py-1">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )) : (
                [1,2,3].map(i => (
                  <div key={i} className="flex-[0_0_30%] pl-6 min-w-0"><div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 h-72 animate-pulse"></div></div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Live Search Results (Job List) */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-white">Live Opportunities</h2>
            <Badge variant="outline" className="border-[#9fff00] text-[#9fff00] bg-[#9fff00]/10 px-3 py-1">
              {opportunities.length} Results
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [1,2,3,4,5,6].map(i => <div key={i} className="h-44 bg-[#0A0A0A] rounded-2xl border border-white/5 animate-pulse"></div>)
            ) : opportunities.length === 0 ? (
              <div className="col-span-full py-20 text-center text-white/50 bg-[#0A0A0A] rounded-2xl border border-white/10">
                <Compass className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No opportunities found. Adjust your search.</p>
              </div>
            ) : (
              opportunities.map((job, idx) => (
                <Card key={idx} className="bg-[#0A0A0A] border-white/10 rounded-2xl hover:bg-[#111] transition-all group overflow-hidden shadow-lg hover:shadow-xl cursor-pointer" onClick={() => setSelectedJob({ ...job, company: job.company_name })}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#9fff00]/0 via-[#9fff00]/50 to-[#9fff00]/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 group-hover:text-[#9fff00] transition-colors">{job.title}</h3>
                    <p className="text-white/60 mb-5 font-medium">{job.company_name}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-white/50 mb-6 bg-white/5 inline-flex px-3 py-1.5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-1.5"><MapPin size={14}/> {job.location}</div>
                      <div className="w-[1px] h-3 bg-white/20"></div>
                      <div className="flex items-center gap-1.5"><Briefcase size={14}/> {job.type}</div>
                    </div>
                    
                    <div className="flex justify-between items-center border-t border-white/10 pt-5">
                      <Badge variant="outline" className="bg-transparent border-white/20 text-white/60">
                        Trust: <span className="text-white ml-1 font-bold">{job.trust_score}</span>
                      </Badge>
                      <a href={job.apply_url || "#"} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white hover:text-[#9fff00] flex items-center gap-1.5 group/link">
                        Apply <ExternalLink size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

      </div>

      <OnboardingModal />
      <JobDetailsDrawer job={selectedJob} isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
