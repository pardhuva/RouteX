import { useState } from "react";
import { Star, ThumbsUp, Sparkles, CheckCircle2 } from "lucide-react";
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
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-center shadow-xs animate-fade-in">
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h3 className="mt-2 text-sm font-bold text-slate-900">Trip Feedback Submitted</h3>
        <p className="text-[11px] text-slate-500">Your review helps our driver community.</p>

        <div className="mt-2 flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= finalRating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200"
              }`}
            />
          ))}
          <span className="ml-1.5 font-black text-xs text-slate-800">{finalRating}.0</span>
        </div>

        {(ride.feedback || feedback) && (
          <p className="mt-2 rounded-lg bg-white p-2 text-xs text-slate-600 border border-slate-200 italic">
            "{ride.feedback || feedback}"
          </p>
        )}
      </div>
    );
  }

  const activeStarCount = hoverRating || rating;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <div>
          <h3 className="text-sm font-bold text-slate-900">Rate Your Driver</h3>
          <p className="text-[11px] text-slate-500">How was your trip with {ride.driver?.name || "your driver"}?</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-3.5 space-y-3">
        {/* Star Rating Interactive Selector */}
        <div className="flex flex-col items-center justify-center rounded-lg bg-slate-50 p-3 border border-slate-100">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    star <= activeStarCount
                      ? "fill-amber-400 text-amber-400 drop-shadow-2xs"
                      : "fill-slate-200 text-slate-300 hover:fill-amber-200"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="mt-1.5 text-[11px] font-bold text-amber-700">
            {RATING_LABELS[activeStarCount] || "Tap a star to rate"}
          </span>
        </div>

        {/* Quick compliment tags */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            What went well? (Optional)
          </label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {COMPLIMENT_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
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
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Comments
          </label>
          <textarea
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share details about your trip..."
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <Button
          type="submit"
          fullWidth
          size="md"
          variant="dark"
          loading={submitting}
          icon={ThumbsUp}
          className="font-bold"
        >
          Submit Driver Rating
        </Button>
      </form>
    </div>
  );
}
