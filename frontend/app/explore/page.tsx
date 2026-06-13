"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Briefcase, IndianRupee, Star, ExternalLink, Filter } from "lucide-react";
import Link from "next/link";

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

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [opportunities, setOpportunities] = useState<ExploreOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from /api/explore
    // For now, using mock data for the UI
    setTimeout(() => {
      setOpportunities([
        {
          title: "Software Engineering Intern",
          company_name: "TechStartup Ltd",
          location: "Bangalore",
          type: "internship",
          stipend: "₹15,000/mo",
          duration: "3 months",
          skills_required: ["Python", "React"],
          apply_url: "#",
          source: "Internshala",
          company_tier: "Rising Star",
          trust_score: 72
        },
        {
          title: "Data Analyst",
          company_name: "GrowthCo Inc",
          location: "Remote",
          type: "full_time",
          stipend: "₹20,000/mo",
          duration: "6 months",
          skills_required: ["SQL", "Python"],
          apply_url: "#",
          source: "LinkedIn",
          company_tier: "Established",
          trust_score: 85
        },
        {
          title: "Frontend Developer",
          company_name: "CodeCraft Pvt",
          location: "Hyderabad",
          type: "full_time",
          stipend: "₹8 LPA",
          duration: null,
          skills_required: ["React", "TypeScript"],
          apply_url: "#",
          source: "Naukri",
          company_tier: "Emerging",
          trust_score: 58
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-6 bg-white p-4 rounded-xl border">
          <div className="flex items-center gap-2 mb-4 font-semibold text-lg">
            <Filter size={20} />
            Filters
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">Job Type</h3>
            <div className="flex items-center space-x-2">
              <Checkbox id="internship" />
              <label htmlFor="internship" className="text-sm font-medium leading-none">Internship</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="full_time" />
              <label htmlFor="full_time" className="text-sm font-medium leading-none">Full-Time</label>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Company Tier</h3>
            <div className="flex items-center space-x-2">
              <Checkbox id="established" />
              <label htmlFor="established" className="text-sm font-medium leading-none">Established</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="rising" />
              <label htmlFor="rising" className="text-sm font-medium leading-none">Rising Star</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="emerging" />
              <label htmlFor="emerging" className="text-sm font-medium leading-none">Emerging</label>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6 w-full">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input 
              placeholder="Company or skill..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Input 
              placeholder="Location..." 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full sm:w-48"
            />
            <Button>Search</Button>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {loading ? (
              <p>Loading opportunities...</p>
            ) : (
              opportunities.map((job, idx) => (
                <Card key={idx} className="hover:border-blue-300 transition-colors cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-blue-900">{job.title}</h3>
                        <Link href={`/company/${encodeURIComponent(job.company_name)}`} className="text-lg text-gray-700 hover:text-blue-600 hover:underline">
                          {job.company_name}
                        </Link>
                      </div>
                      <Badge variant={job.company_tier === 'Established' ? 'default' : 'secondary'}>
                        <Star className="w-3 h-3 mr-1 inline" />
                        {job.trust_score}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase size={16} />
                        {job.type === 'internship' ? 'Internship' : 'Full-Time'}
                      </div>
                      {job.stipend && (
                        <div className="flex items-center gap-1">
                          <IndianRupee size={16} />
                          {job.stipend} {job.duration ? `· ${job.duration}` : ''}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {job.skills_required.map(skill => (
                        <Badge key={skill} variant="outline">{skill}</Badge>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="text-xs text-gray-500">via {job.source}</span>
                      <Button size="sm" asChild>
                        <a href={job.apply_url || "#"} target="_blank" rel="noopener noreferrer">
                          Apply Now <ExternalLink className="ml-2 w-4 h-4" />
                        </a>
                      </Button>
                    </div>
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
