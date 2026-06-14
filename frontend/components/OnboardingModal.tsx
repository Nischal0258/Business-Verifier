"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, GraduationCap, Clock } from 'lucide-react';

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [employmentStatus, setEmploymentStatus] = useState("");
  
  // Form fields
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [degreeType, setDegreeType] = useState("");
  const [sendUpdates, setSendUpdates] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has already seen the onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      // Small delay to make it feel natural
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStatusSelect = (status: string) => {
    setEmploymentStatus(status);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        is_employed: employmentStatus,
        job_title: jobTitle,
        location: location,
        employer_name: employerName,
        college_name: collegeName,
        degree_type: degreeType,
        send_updates: sendUpdates
      };
      
      const res = await fetch('http://localhost:8000/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        localStorage.setItem('hasSeenOnboarding', 'true');
        setIsOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0c0c11] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative text-white"
        >
          <button 
            onClick={skipOnboarding}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10"
          >
            <X size={20} />
          </button>
          
          <div className="p-8">
            <h2 className="text-2xl font-bold font-display mb-2">Set up your experience</h2>
            <p className="text-zinc-400 text-sm mb-6">Personalize your feed to see the most relevant opportunities.</p>
            
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-medium mb-4">Are you currently employed?</h3>
                
                <button 
                  onClick={() => handleStatusSelect("Yes")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-brand-green/50 hover:bg-brand-green/5 transition-all text-left"
                >
                  <div className="bg-white/5 p-3 rounded-lg text-brand-green">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <div className="font-semibold">Yes</div>
                    <div className="text-sm text-zinc-400">I am currently working</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleStatusSelect("Not currently")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-brand-green/50 hover:bg-brand-green/5 transition-all text-left"
                >
                  <div className="bg-white/5 p-3 rounded-lg text-brand-green">
                    <Clock size={24} />
                  </div>
                  <div>
                    <div className="font-semibold">Not currently</div>
                    <div className="text-sm text-zinc-400">I am looking for opportunities</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleStatusSelect("No, I'm a student")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-brand-green/50 hover:bg-brand-green/5 transition-all text-left"
                >
                  <div className="bg-white/5 p-3 rounded-lg text-brand-green">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <div className="font-semibold">No, I'm a student</div>
                    <div className="text-sm text-zinc-400">I am currently studying</div>
                  </div>
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {employmentStatus === "Yes" && (
                  <>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Job Title</label>
                      <input 
                        type="text" 
                        required
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green"
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Employer Name</label>
                      <input 
                        type="text" 
                        required
                        value={employerName}
                        onChange={e => setEmployerName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green"
                        placeholder="e.g. Google"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Location</label>
                      <input 
                        type="text" 
                        required
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green"
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                  </>
                )}

                {employmentStatus === "Not currently" && (
                  <>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Past Job Title</label>
                      <input 
                        type="text" 
                        required
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green"
                        placeholder="e.g. Marketing Manager"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Location</label>
                      <input 
                        type="text" 
                        required
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green"
                        placeholder="e.g. New York, NY"
                      />
                    </div>
                  </>
                )}

                {employmentStatus === "No, I'm a student" && (
                  <>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">College/University Name</label>
                      <input 
                        type="text" 
                        required
                        value={collegeName}
                        onChange={e => setCollegeName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green"
                        placeholder="e.g. Stanford University"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Degree Type</label>
                        <input 
                          type="text" 
                          required
                          value={degreeType}
                          onChange={e => setDegreeType(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green"
                          placeholder="e.g. B.S. Computer Science"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Desired Job Title</label>
                        <input 
                          type="text" 
                          required
                          value={jobTitle}
                          onChange={e => setJobTitle(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green"
                          placeholder="e.g. Intern"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Desired Location</label>
                      <input 
                        type="text" 
                        required
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-brand-green"
                        placeholder="e.g. Remote"
                      />
                    </div>
                  </>
                )}

                <label className="flex items-center gap-3 cursor-pointer py-2">
                  <input 
                    type="checkbox" 
                    checked={sendUpdates}
                    onChange={e => setSendUpdates(e.target.checked)}
                    className="w-5 h-5 accent-brand-green rounded border-white/20 bg-black/40"
                  />
                  <span className="text-sm text-zinc-300">Send me updates when new jobs are available</span>
                </label>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 rounded-lg font-semibold bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 rounded-lg font-semibold bg-brand-green text-black hover:bg-brand-green/90 transition-colors"
                  >
                    {loading ? "Saving..." : "Complete Setup"}
                  </button>
                </div>
              </motion.form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
