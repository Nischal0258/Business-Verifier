"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, DollarSign, Clock, ExternalLink, BookmarkPlus, Share2, ThumbsUp, ThumbsDown, Star, Activity } from 'lucide-react';

export default function JobDetailsDrawer({ job, isOpen, onClose }: { job: any, isOpen: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('description');
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && job?.company) {
      fetchInsights(job.company);
      setActiveTab('description'); // Reset tab on open
    }
  }, [isOpen, job]);

  const fetchInsights = async (companyName: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/company/${encodeURIComponent(companyName)}/insights`);
      const data = await res.json();
      if (data.success && data.insights) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.error("Failed to fetch insights", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !job) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
        />

        {/* Drawer */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl bg-[#09090b] border-l border-white/10 h-full overflow-y-auto text-white shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#09090b]/80 backdrop-blur-md border-b border-white/10 z-10 p-6">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex gap-4 items-start pr-12">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-green to-emerald-700 flex items-center justify-center font-bold text-2xl text-black shrink-0">
                {job.company.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display leading-tight">{job.title}</h1>
                <div className="flex items-center gap-2 mt-1 text-zinc-400">
                  <span className="font-medium text-zinc-300">{job.company}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-sm">
                    <Star size={14} className="text-brand-green fill-brand-green" />
                    <span>{job.trust_score || 4.5} Trust Score</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-sm">
                <MapPin size={16} className="text-zinc-400" />
                {job.location || 'Remote'}
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full text-sm">
                <DollarSign size={16} className="text-zinc-400" />
                {job.stipend || 'Competitive'}
              </div>
              <div className="flex items-center gap-2 bg-brand-green/10 text-brand-green px-3 py-1.5 rounded-full text-sm font-medium">
                <Clock size={16} />
                Urgently Hiring
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <a href={job.url || "#"} target="_blank" rel="noreferrer" className="flex-1 bg-brand-green text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-green/90 transition-all">
              Apply on Company Site <ExternalLink size={18} />
            </a>
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition-all" title="Save Job">
              <BookmarkPlus size={20} />
            </button>
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 transition-all" title="Share">
              <Share2 size={20} />
            </button>
            <div className="flex items-center gap-1 ml-auto bg-white/5 rounded-lg p-1">
              <button className="p-2 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-all"><ThumbsUp size={18} /></button>
              <button className="p-2 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-all"><ThumbsDown size={18} /></button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 px-6 pt-4 sticky top-[210px] bg-[#09090b]/90 backdrop-blur-md z-10">
            {['description', 'reviews', 'salary'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-4 font-medium capitalize relative ${activeTab === tab ? 'text-brand-green' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {tab === 'salary' ? 'Salary Guide' : tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green" />
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="p-6 flex-1">
            {activeTab === 'description' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-invert max-w-none text-zinc-300">
                <h3 className="text-xl font-semibold text-white mb-4">About the Role</h3>
                <p>Join our dynamic team at {job.company} and help build the future. We are looking for passionate individuals who thrive in fast-paced environments.</p>
                
                <h4 className="text-lg font-medium text-white mt-6 mb-2">Key Responsibilities</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Develop and maintain high-quality solutions.</li>
                  <li>Collaborate with cross-functional teams to define and ship new features.</li>
                  <li>Identify and correct bottlenecks and fix bugs.</li>
                  <li>Help maintain quality, organization, and automatization.</li>
                </ul>
                
                <h4 className="text-lg font-medium text-white mt-6 mb-2">Requirements</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Strong proficiency in relevant technologies.</li>
                  <li>Experience with modern development practices.</li>
                  <li>Excellent problem-solving skills.</li>
                </ul>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-4 mb-8 bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="text-5xl font-bold text-white">{job.trust_score || '4.5'}</div>
                  <div>
                    <div className="flex text-brand-green mb-1">
                      <Star size={18} className="fill-brand-green" /><Star size={18} className="fill-brand-green" /><Star size={18} className="fill-brand-green" /><Star size={18} className="fill-brand-green" /><Star size={18} className="fill-brand-green opacity-50" />
                    </div>
                    <div className="text-sm text-zinc-400">Based on recent insights</div>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12"><Activity className="animate-spin text-brand-green" size={32} /></div>
                ) : insights?.reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {insights.reviews.map((rev: any, idx: number) => (
                      <div key={idx} className="bg-black/40 p-5 rounded-xl border border-white/10">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-white">{rev.title}</div>
                          <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs text-zinc-200">
                            {rev.rating} <Star size={12} className="text-yellow-400 fill-yellow-400" />
                          </div>
                        </div>
                        <div className="text-sm text-zinc-500 mb-3">{rev.author_role}</div>
                        <p className="text-zinc-300 text-sm leading-relaxed">{rev.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    {insights?.error ? `Error: ${insights.error}` : "No reviews found for this company."}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'salary' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-xl font-semibold text-white mb-6">Estimated Salary Guide</h3>
                {loading ? (
                  <div className="flex justify-center py-12"><Activity className="animate-spin text-brand-green" size={32} /></div>
                ) : insights?.salary_guide?.length > 0 ? (
                  <div className="space-y-4">
                    {insights.salary_guide.map((sal: any, idx: number) => (
                      <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white mb-1">{sal.role}</div>
                          <div className="text-xs text-zinc-400">Estimated Range: {sal.range}</div>
                        </div>
                        <div className="text-lg font-bold text-brand-green">{sal.average_salary}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    {insights?.error ? `Error: ${insights.error}` : "Salary data not available for this company."}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
