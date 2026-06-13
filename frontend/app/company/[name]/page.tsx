"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Star, MapPin, Building, ShieldCheck, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { CompanyStudentReport } from "@/types";

export default function CompanyPage({ params }: { params: { name: string } }) {
  const companyName = decodeURIComponent(params.name);
  const [report, setReport] = useState<CompanyStudentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/company/${encodeURIComponent(companyName)}/report`);
        const data = await res.json();
        
        if (data.success && data.report) {
          setReport(data.report);
        } else {
          console.error("Failed to load report:", data.error);
        }
      } catch (err) {
        console.error("Error fetching company report:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [companyName]);

  if (loading) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Generating Student Intelligence Report...</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Our CrewAI agent team (Manager, Scout, Hunter, Detective, and Evaluator) is currently scouring the web for {companyName}. This usually takes about 20-30 seconds.
        </p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Company Header */}
      <Card className="border-t-4 border-t-blue-600 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{report.company_name}</h1>
              <div className="flex flex-wrap gap-4 text-gray-600">
                <span className="flex items-center"><Building className="w-4 h-4 mr-1" /> {report.basic_info.industry}</span>
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> Bangalore</span>
                <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> {report.basic_info.employees} employees</span>
              </div>
            </div>
            <div className="flex flex-col items-end bg-slate-50 p-4 rounded-xl border">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Student Trust Score</div>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-blue-700">{report.trust_score.total_score}</span>
                <Badge variant={report.trust_score.company_tier === 'Rising Star' ? 'default' : 'secondary'} className="text-sm py-1">
                  🌟 {report.trust_score.company_tier}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Details & Reviews */}
        <div className="md:col-span-2 space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Star className="text-yellow-500" /> What Employees Say
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl font-bold">{report.reviews.overall_rating}</div>
                <div>
                  <div className="flex text-yellow-500">★★★★☆</div>
                  <div className="text-sm text-gray-500">Based on {report.reviews.review_count} reviews</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h4 className="font-semibold text-green-800 mb-2">Top Pros</h4>
                  <ul className="space-y-1 text-sm text-green-900">
                    {report.reviews.top_pros.map((pro, i) => <li key={i}>✓ {pro}</li>)}
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <h4 className="font-semibold text-red-800 mb-2">Top Cons</h4>
                  <ul className="space-y-1 text-sm text-red-900">
                    {report.reviews.top_cons.map((con, i) => <li key={i}>✗ {con}</li>)}
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-blue-900 font-medium">
                  <span className="font-bold">🎓 Student Verdict:</span> {report.reviews.student_verdict}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Open Opportunities ({report.opportunities.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.opportunities.map((opp, idx) => (
                <div key={idx} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{opp.title}</h3>
                    <Badge variant={opp.type === 'internship' ? 'default' : 'outline'}>
                      {opp.type === 'internship' ? 'Internship' : 'Full-Time'}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/>{opp.location}</span>
                    {opp.stipend && <span>💰 {opp.stipend}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {opp.skills_required.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-gray-100 text-xs rounded-md">{skill}</span>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={opp.apply_url || "#"} target="_blank" rel="noopener noreferrer">
                      Apply via {opp.source} <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Score Breakdown & Connect */}
        <div className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Hiring Activity</span>
                  <span className="font-medium">{report.trust_score.breakdown.hiring}/25</span>
                </div>
                <Progress value={(report.trust_score.breakdown.hiring / 25) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Employee Reviews</span>
                  <span className="font-medium">{report.trust_score.breakdown.reviews}/20</span>
                </div>
                <Progress value={(report.trust_score.breakdown.reviews / 20) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Legitimacy</span>
                  <span className="font-medium">{report.trust_score.breakdown.legitimacy}/15</span>
                </div>
                <Progress value={(report.trust_score.breakdown.legitimacy / 15) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Social Presence</span>
                  <span className="font-medium">{report.trust_score.breakdown.social}/15</span>
                </div>
                <Progress value={(report.trust_score.breakdown.social / 15) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Intern Friendliness</span>
                  <span className="font-medium">{report.trust_score.breakdown.intern_friendly}/15</span>
                </div>
                <Progress value={(report.trust_score.breakdown.intern_friendly / 15) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Growth Signals</span>
                  <span className="font-medium">{report.trust_score.breakdown.growth}/10</span>
                </div>
                <Progress value={(report.trust_score.breakdown.growth / 10) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Connect With Them</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.social_media.linkedin_url && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={report.social_media.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" className="w-4 h-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              )}
              {report.social_media.twitter_url && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={report.social_media.twitter_url} target="_blank" rel="noopener noreferrer">
                    <span className="font-bold mr-2">𝕏</span> Twitter
                  </a>
                </Button>
              )}
              <Button variant="default" className="w-full" asChild>
                <a href={`/api/company/${encodeURIComponent(companyName)}/report/pdf`} target="_blank">
                  Download PDF Report
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <TrendingUp className="text-green-400 mt-1 shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Company Growth</h4>
                  <p className="text-sm text-slate-300">{report.growth.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
