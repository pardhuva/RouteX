import { useState } from "react";
import { Star, ThumbsUp, Sparkles, MessageSquare, CheckCircle2 } from "lucide-react";
import Button from "../Button";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const RATING_LABELS = {
  1: "Needs Improvement",
  2: "Fair",
  3: "Good Trip",
  4: "Very Good & Polite",
  5: "Outstanding Experience!",
};

const COMPLIMENT_TAGS = [
  "Smooth Driving",
  "Clean Vehicle",
  "Polite & Professional",
  "On-Time Pickup",
  "Great Route Choice",
  "Comfortable Ride",
];

export default function DriverRatingCard({ ride, onRatingSubmitted }) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(ride.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedback, setFeedback] = useState(ride.feedback || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(ride.rating));

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      showToast("Please select a star rating between 1 and 5.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const combinedFeedback = [
        ...selectedTags,
        feedback.trim(),
      ]
        .filter(Boolean)
        .join(" · ");

      const res = await rideApi.rateDriver(ride._id, {
        rating,
        feedback: combinedFeedback || undefined,
      });

      setSubmitted(true);
      showToast("Thank you! Your driver rating has been recorded.", "success");
      onRatingSubmitted?.(res.data.data.ride);
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't submit your rating. Please try again."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted || ride.rating) {
    const finalRating = ride.rating || rating;
    return (
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-6 text-center shadow-card animate-fade-in">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-soft">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-extrabold text-slate-900">Trip Feedback Submitted</h3>
        <p className="mt-0.5 text-xs text-slate-500">Your review helps our driver community thrive.</p>

        <div className="mt-3 flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 ${
                star <= finalRating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200"
              }`}
            />
          ))}
          <span className="ml-2 font-black text-sm text-slate-800">{finalRating}.0</span>
        </div>

        {(ride.feedback || feedback) && (
          <p className="mt-3 rounded-xl bg-white/80 p-3 text-xs text-slate-600 border border-slate-200/80 italic">
            "{ride.feedback || feedback}"
          </p>
        )}
      </div>
    );
  }

  const activeStarCount = hoverRating || rating;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Rate Your Driver</h3>
          <p className="text-xs text-slate-500">How was your trip with {ride.driver?.name || "your driver"}?</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Star Rating Interactive Selector */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="group p-1 transition-transform hover:scale-125 focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= activeStarCount
                      ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                      : "fill-slate-200 text-slate-300 group-hover:fill-amber-200"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="mt-2 text-xs font-bold tracking-wide text-amber-700">
            {RATING_LABELS[activeStarCount] || "Tap a star to rate"}
          </span>
        </div>

        {/* Quick compliment tags */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            What went well? (Optional)
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMPLIMENT_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Written Review */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Additional Comments
          </label>
          <textarea
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share details about your experience..."
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={submitting}
          icon={ThumbsUp}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
        >
          Submit Driver Rating
        </Button>
      </form>
    </div>
  );
}
