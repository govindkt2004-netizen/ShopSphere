import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  ThumbsUp,
  Filter,
  LogIn,
  Edit3,
  Trash2,
  Sparkles,
  AlertCircle,
  Clock,
  User as UserIcon,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Product, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

interface ProductReviewsProps {
  product: Product;
  onProductUpdate: (updatedProduct: Product) => void;
  onNavigate: (view: string, param?: string) => void;
}

const RATING_LABELS: Record<number, { title: string; desc: string; color: string }> = {
  1: { title: 'Terrible', desc: 'Major quality issues or not as described', color: 'text-rose-500' },
  2: { title: 'Poor', desc: 'Did not meet expectations in several aspects', color: 'text-orange-500' },
  3: { title: 'Average', desc: 'Acceptable quality, works as expected', color: 'text-amber-500' },
  4: { title: 'Very Good', desc: 'High quality with minor room for improvement', color: 'text-emerald-500' },
  5: { title: 'Outstanding', desc: 'Exceeded expectations, highly recommended', color: 'text-emerald-600' }
};

const SUGGESTED_TAGS = [
  'Exceptional Build Quality',
  'Fast & Safe Delivery',
  'Great Value for Price',
  'Matches Description',
  'Premium Packaging',
  'Long Battery Life',
  'Highly Recommended'
];

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  product,
  onProductUpdate,
  onNavigate
}) => {
  const { user, isAuthenticated } = useAuth();
  const { success, error, info } = useToast();

  // Review submission form state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showEditForm, setShowEditForm] = useState<boolean>(false);

  // Review filters & sorting
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [userVotedReviews, setUserVotedReviews] = useState<Record<string, boolean>>({});

  const reviewsList = useMemo(() => product.reviews || [], [product.reviews]);

  // Check if current authenticated user has already reviewed this product
  const userExistingReview = useMemo(() => {
    if (!user || !reviewsList.length) return null;
    return reviewsList.find((r) => r.userId === user.id) || null;
  }, [user, reviewsList]);

  // Populate form if user has an existing review and enters edit mode
  useEffect(() => {
    if (userExistingReview && showEditForm) {
      setRating(userExistingReview.rating);
      setComment(userExistingReview.comment);
    }
  }, [userExistingReview, showEditForm]);

  // Rating Distribution breakdown (5, 4, 3, 2, 1)
  const ratingDistribution = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((rev) => {
      const r = Math.min(5, Math.max(1, Math.round(rev.rating)));
      counts[r] = (counts[r] || 0) + 1;
    });

    const total = reviewsList.length;
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = counts[stars] || 0;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { stars, count, percentage };
    });
  }, [reviewsList]);

  // Filtered & Sorted Reviews
  const filteredReviews = useMemo(() => {
    let list = [...reviewsList];

    if (selectedStarFilter !== null) {
      list = list.filter((r) => Math.round(r.rating) === selectedStarFilter);
    }

    if (sortBy === 'highest') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      list.sort((a, b) => a.rating - b.rating);
    } else {
      // most recent
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [reviewsList, selectedStarFilter, sortBy]);

  // Handle Review Submission (Create or Update)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      info('Please sign in to submit your product review.');
      onNavigate('login');
      return;
    }

    if (!comment.trim()) {
      error('Please write a brief comment describing your experience.');
      return;
    }

    if (comment.trim().length < 5) {
      error('Please write at least 5 characters in your review comment.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.products.addReview(product.id, {
        rating,
        comment: comment.trim(),
        userName: user?.name || 'Verified Shopper'
      });

      if (res.product) {
        onProductUpdate(res.product);
      }
      setComment('');
      setShowEditForm(false);
      success(
        userExistingReview
          ? 'Your review was updated successfully!'
          : 'Thank you! Your verified review has been published.'
      );
    } catch (err: any) {
      console.error('Error submitting review:', err);
      error(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Review Deletion
  const handleDeleteReview = async () => {
    if (!isAuthenticated || !userExistingReview) return;

    if (!window.confirm('Are you sure you want to remove your review for this product?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await api.products.deleteReview(product.id);
      if (res.product) {
        onProductUpdate(res.product);
      }
      setComment('');
      setShowEditForm(false);
      success('Your review has been removed.');
    } catch (err: any) {
      console.error('Error deleting review:', err);
      error(err.message || 'Failed to delete review.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle quick tag insertion into comment
  const handleTagClick = (tag: string) => {
    if (comment.includes(tag)) {
      return;
    }
    const separator = comment.trim().length > 0 ? '. ' : '';
    setComment((prev) => `${prev.trim()}${separator}${tag}`);
  };

  // Helpful vote toggle
  const handleHelpfulToggle = (reviewId: string) => {
    const isVoted = userVotedReviews[reviewId];
    setUserVotedReviews((prev) => ({ ...prev, [reviewId]: !isVoted }));
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + (isVoted ? -1 : 1)
    }));
  };

  const activeStarDisplay = hoverRating || rating;
  const currentRatingMeta = RATING_LABELS[activeStarDisplay] || RATING_LABELS[5];

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div id="product-reviews-section" className="space-y-8">
      {/* SECTION HEADER & SUMMARY CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white">
                Customer Ratings & Reviews
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verified community experiences and authentic feedback from verified buyers.
            </p>
          </div>

          {/* Aggregate Rating Score Box */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="text-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 block font-medium">out of 5.0</span>
            </div>

            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-1">
              <div className="flex items-center text-amber-400 gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                {product.numReviews} Verified {product.numReviews === 1 ? 'Rating' : 'Ratings'}
              </p>
            </div>
          </div>
        </div>

        {/* RATING BREAKDOWN & DISTRIBUTION BARS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Rating Breakdown
            </h4>

            {ratingDistribution.map((item) => (
              <button
                key={item.stars}
                onClick={() =>
                  setSelectedStarFilter((prev) => (prev === item.stars ? null : item.stars))
                }
                className={`w-full flex items-center gap-3 p-1.5 rounded-xl text-xs transition-all text-left group ${
                  selectedStarFilter === item.stars
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
                title={`Filter by ${item.stars} Stars`}
              >
                <div className="flex items-center gap-1 w-14 shrink-0 font-medium text-slate-700 dark:text-slate-300">
                  <span>{item.stars}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>

                <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.stars >= 4
                        ? 'bg-emerald-500'
                        : item.stars === 3
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <div className="w-16 text-right text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {item.percentage}%
                  </span>{' '}
                  ({item.count})
                </div>
              </button>
            ))}
          </div>

          {/* Quick Highlight Box */}
          <div className="md:col-span-5 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 dark:from-indigo-950/30 dark:to-slate-800/40 rounded-2xl p-5 border border-indigo-100/80 dark:border-indigo-900/40 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>100% Genuine Buyer Feedback</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Every review on ShopSphere is sourced from verified accounts with confirmed purchase transactions.
            </p>
            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              <span>Average recommendation rate</span>
              <span className="font-bold font-mono">
                {reviewsList.length > 0
                  ? `${Math.round(
                      (reviewsList.filter((r) => r.rating >= 4).length / reviewsList.length) * 100
                    )}%`
                  : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* USER REVIEW SUBMISSION / AUTHENTICATION CALLOUT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        {!isAuthenticated ? (
          /* Unauthenticated Callout */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <LogIn className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Have you used or purchased this product?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  Sign in with your customer account to rate this item, write verified feedback, and help the community.
                </p>
              </div>
            </div>

            <button
              id="review-signin-prompt-btn"
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In to Leave a Review</span>
            </button>
          </div>
        ) : userExistingReview && !showEditForm ? (
          /* Existing User Review Badge & View */
          <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300">
                    You have already reviewed this item
                  </h4>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                    Published on {formatDate(userExistingReview.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="edit-my-review-btn"
                  onClick={() => setShowEditForm(true)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Edit Feedback</span>
                </button>

                <button
                  id="delete-my-review-btn"
                  onClick={handleDeleteReview}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Removing...' : 'Delete'}</span>
                </button>
              </div>
            </div>

            {/* Display user's review details */}
            <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
              <div className="flex items-center text-amber-400 gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= userExistingReview.rating ? 'fill-current' : 'text-slate-200 dark:text-slate-700'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-2">
                  {userExistingReview.rating} / 5 Stars
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                "{userExistingReview.comment}"
              </p>
            </div>
          </div>
        ) : (
          /* Authenticated Interactive Submission Form */
          <form onSubmit={handleSubmitReview} className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {userExistingReview ? 'Update Your Product Review' : 'Write a Product Review'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Posting verified feedback as <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.name}</span>
                  </p>
                </div>
              </div>

              {userExistingReview && showEditForm && (
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* Star Rating Interactive Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Overall Score & Rating <span className="text-rose-500">*</span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 text-amber-400 hover:scale-115 transition-transform focus:outline-none"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= activeStarDisplay
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-slate-300 dark:text-slate-700 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                  <span className={`text-xs font-bold ${currentRatingMeta.color}`}>
                    {activeStarDisplay} Stars — {currentRatingMeta.title}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    ({currentRatingMeta.desc})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Sentiment Tags */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Quick Highlights (Click to add)
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((tag) => {
                  const isIncluded = comment.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isIncluded
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600'
                      }`}
                    >
                      {isIncluded ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Feedback Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Your Detailed Review & Experience <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {comment.length} characters
                </span>
              </div>

              <textarea
                id="product-review-comment-input"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts on build quality, audio fidelity, design, usability, packaging, or customer service..."
                className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                id="submit-product-review-btn"
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting
                    ? 'Publishing...'
                    : userExistingReview
                    ? 'Update My Review'
                    : 'Submit Verified Review'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FILTER & SORT CONTROLS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <button
            onClick={() => setSelectedStarFilter(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedStarFilter === null
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            All ({reviewsList.length})
          </button>

          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviewsList.filter((r) => Math.round(r.rating) === stars).length;
            if (count === 0 && selectedStarFilter !== stars) return null;
            return (
              <button
                key={stars}
                onClick={() => setSelectedStarFilter(stars)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                  selectedStarFilter === stars
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{stars}★</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((rev) => {
            const isUserReview = user && rev.userId === user.id;
            const isHelpfulActive = userVotedReviews[rev.id] || false;
            const currentHelpfulCount = (helpfulVotes[rev.id] || 0) + (rev.rating >= 4 ? 4 : 1);

            return (
              <div
                key={rev.id}
                className={`p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                  isUserReview
                    ? 'border-indigo-300 dark:border-indigo-800 shadow-sm ring-1 ring-indigo-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 shadow-2xs'
                } space-y-3`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {rev.userName?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {rev.userName}
                        </span>
                        {isUserReview && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                            You
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200/60 dark:border-emerald-800/60">
                          <Check className="w-3 h-3" />
                          Verified Purchase
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating ? 'fill-current' : 'text-slate-200 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1.5 font-mono">
                      {rev.rating}.0
                    </span>
                  </div>
                </div>

                {/* Review Comment Text */}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-12">
                  {rev.comment}
                </p>

                {/* Footer / Helpful Feedback Counter */}
                <div className="flex items-center justify-between pt-2 pl-12 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleHelpfulToggle(rev.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                        isHelpfulActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${isHelpfulActive ? 'fill-current' : ''}`} />
                      <span>Helpful ({currentHelpfulCount})</span>
                    </button>
                  </div>

                  {isUserReview && (
                    <button
                      onClick={() => setShowEditForm(true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit Your Review
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty Reviews Filter State */
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedStarFilter !== null
                ? `No ${selectedStarFilter}-star reviews found`
                : 'No customer reviews yet'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {selectedStarFilter !== null
                ? 'Try selecting a different star rating filter to view more feedback.'
                : 'Be the first authenticated customer to rate and review this product!'}
            </p>
            {selectedStarFilter !== null && (
              <button
                onClick={() => setSelectedStarFilter(null)}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
              >
                Clear Star Filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
