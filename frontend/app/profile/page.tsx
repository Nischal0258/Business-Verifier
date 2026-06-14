"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Plus, Trash2, User, Building2 } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import ReviewCard from "@/components/cards/ReviewCard";
import { getFavorites, addFavorite, removeFavorite, getCompanyReviews, submitReview } from "@/lib/api";
import type { FavoriteCompanyResponse, InternalStudentReviewResponse, InternalStudentReviewCreate } from "@/types/student";

export default function ProfilePage() {
  const [favorites, setFavorites] = useState<FavoriteCompanyResponse[]>([]);
  const [reviews, setReviews] = useState<InternalStudentReviewResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // For submitting new review
  const [selectedCompany, setSelectedCompany] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [isInternship, setIsInternship] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [favs, rev] = await Promise.all([
        getFavorites(),
        // For demo, get reviews for first favorite or a default
        getCompanyReviews("Google")
      ]);
      setFavorites(favs);
      setReviews(rev);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddFavorite = async (companyName: string) => {
    try {
      await addFavorite({ company_name: companyName, alerts_enabled: true });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFavorite = async (companyName: string) => {
    try {
      await removeFavorite(companyName);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !newReviewText) return;

    setIsSubmitting(true);
    try {
      const reviewData: InternalStudentReviewCreate = {
        company_name: selectedCompany,
        rating: newRating,
        review_text: newReviewText,
        is_internship: isInternship
      };
      await submitReview(reviewData);
      setSelectedCompany("");
      setNewReviewText("");
      setNewRating(5);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#050508] min-h-screen font-sans text-white relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#64CEFB]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#A855F7]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Main Container */}
      <div className="container mx-auto py-16 px-4 relative z-10 max-w-7xl">
        <h1 className="text-4xl font-bold mb-10 flex items-center gap-3">
          <User className="w-10 h-10 text-[#A855F7]" />
          Personal Center
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Favorite Companies Column */}
          <Card className="bg-white/[0.02] border border-white/10 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Heart className="w-6 h-6 text-[#A855F7]" />
                  Saved Companies
                </h2>
                <Button
                  variant="default"
                  className="bg-[#A855F7] hover:bg-[#9333EA]"
                  onClick={() => handleAddFavorite("Microsoft")}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Quick Demo
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-white/20 border-t-[#64CEFB] rounded-full animate-spin"></div>
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-white/40">
                  No favorite companies saved yet.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#64CEFB]/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-[#64CEFB]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{fav.company_name}</h3>
                          <p className="text-xs text-white/40">
                            Alerts {fav.alerts_enabled ? "enabled" : "disabled"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                        onClick={() => handleRemoveFavorite(fav.company_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Column */}
          <div className="flex flex-col gap-6">
            {/* Write a Review */}
            <Card className="bg-white/[0.02] border border-white/10 rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Write a Review</h2>
                <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="Company name"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#64CEFB]"
                  />

                  <div className="flex items-center gap-3">
                    <span className="text-white/60">Rating:</span>
                    <Rating
                      value={newRating}
                      onRate={setNewRating}
                      color="text-[#64CEFB]"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-white/60">
                    <input
                      type="checkbox"
                      checked={isInternship}
                      onChange={(e) => setIsInternship(e.target.checked)}
                    />
                    This is an internship review
                  </label>

                  <textarea
                    placeholder="Write your review here..."
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#64CEFB]"
                  />

                  <Button
                    type="submit"
                    className="bg-[#A855F7] hover:bg-[#9333EA] disabled:opacity-50"
                    disabled={isSubmitting || !selectedCompany || !newReviewText}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Your Reviews */}
            <Card className="bg-white/[0.02] border border-white/10 rounded-2xl">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Your Reviews</h2>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-white/20 border-t-[#64CEFB] rounded-full animate-spin"></div>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-white/40">
                    No reviews yet. Be the first to review a company!
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
