import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  MapPin,
  Navigation,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Phone,
  Heart,
  ExternalLink,
} from "lucide-react";
import MapView from "../MapView";
import RideStatusTimeline from "../RideStatusTimeline";
import PersonInfoCard from "../PersonInfoCard";
import Button from "../Button";
import Modal from "../Modal";
import SupportReportModal from "../SupportReportModal";
import SafetyCheckInModal from "./SafetyCheckInModal";
import PaymentPanel from "./PaymentPanel";
import { useLiveRide } from "../../hooks/useLiveRide";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";

const STATUS_COPY = {
  requested: {
    title: "Searching for nearby drivers...",
    description: "Finding the closest available partner driver to accept your request.",
  },
  accepted: {
    title: "Driver assigned & en route",
    description: "Share the 4-digit start PIN with your driver upon arrival.",
  },
  started: {
    title: "Trip in progress",
    description: "Heading towards your drop-off destination.",
  },
};

function toLatLng(point) {
  if (!point?.location?.coordinates) return null;
  const [longitude, latitude] = point.location.coordinates;
  return { latitude, longitude };
}

export default function ActiveRidePanel({ ride, onRideChange, onCancelled }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [safetyStatus, setSafetyStatus] = useState(null);
  const [confirmingSafety, setConfirmingSafety] = useState(false);

  // Load safety alert status
  const checkSafetyStatus = useCallback(() => {
    if (ride?._id) {
      rideApi
        .getRideSafetyStatus(ride._id)
        .then((res) => {
          setSafetyStatus(res.data?.data);
        })
        .catch(() => {});
    }
  }, [ride?._id]);

  useEffect(() => {
    checkSafetyStatus();
  }, [checkSafetyStatus, ride?.status]);

  const handleRideUpdate = useCallback(
    (updatedRide) => {
      onRideChange(() => updatedRide);
      if (updatedRide.status === "completed") {
        showToast("Destination reached! Please complete payment settlement.", "success");
      } else if (updatedRide.status === "cancelled") {
        showToast("This ride was cancelled.", "info");
      }
      checkSafetyStatus();
    },
    [onRideChange, showToast, checkSafetyStatus]
  );

  const { driverLocation, matchingRadius } = useLiveRide(ride._id, { onRideUpdate: handleRideUpdate });

  async function handleCancel() {
    setCancelling(true);
    try {
      await rideApi.cancelRide(ride._id);
      showToast("Ride cancelled.", "info");
      onCancelled();
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't cancel this ride."), "error");
    } finally {
      setCancelling(false);
    }
  }

  async function handleQuickReachedSafely() {
    setConfirmingSafety(true);
    try {
      await rideApi.confirmSafety(ride._id);
      showToast("Safe arrival confirmed. Have a great day!", "success");
      checkSafetyStatus();
    } catch (err) {
      showToast(getErrorMessage(err, "Could not record safe check-in."), "error");
    } finally {
      setConfirmingSafety(false);
    }
  }

  const trackingToken = ride.trackingToken || ride._id;
  const trackingUrl = `${window.location.origin}/track/${trackingToken}`;
  const emergencyContacts = user?.emergencyContacts || [];

  function handleCopyLink() {
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(true);
    showToast("Live tracking link copied to clipboard!", "success");
    setTimeout(() => setCopiedLink(false), 2500);
  }

  const pickupPoint = toLatLng(ride.pickup);
  const destinationPoint = toLatLng(ride.destination);
  const copy = STATUS_COPY[ride.status];
  const hasActiveAlert = safetyStatus?.hasActiveAlert;
  const hasConfirmedSafe = Boolean(safetyStatus?.safeConfirmationAt);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left Control Panel (5 cols) */}
      <div className="space-y-4 lg:col-span-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-900">Active Ride</h2>
              </div>
              <p className="mt-0.5 font-mono text-[10px] text-slate-400">ID: {ride._id}</p>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Share Live Trip Button */}
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition-colors"
                title="Share Live Trip with Family"
              >
                <Share2 className="h-3.5 w-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Share Trip</span>
              </button>

              {/* Support modal button */}
              <button
                type="button"
                onClick={() => setSupportOpen(true)}
                className="text-[11px] text-slate-500 hover:text-slate-900 font-medium px-2 py-1 rounded hover:bg-slate-50"
              >
                Help
              </button>

              {/* Safety Shield Button */}
              <button
                type="button"
                onClick={() => setSafetyOpen(true)}
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                  hasActiveAlert
                    ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse"
                    : "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 border border-slate-200"
                }`}
                title="Rider Safety & Check-In"
              >
                {hasActiveAlert ? (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    <span>Alert Active</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Safety Shield</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Safety Banner if triggered */}
          {hasActiveAlert && (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>Safety Operations Alert Active</span>
                  <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded">LIVE</span>
                </div>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Our operations team is monitoring this ride. Tap "Safety Shield" to update or close once safe.
                </p>
              </div>
            </div>
          )}

          {/* Vehicle & Upfront Fare Strip */}
          <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs border border-slate-100">
            <span className="font-bold text-slate-800 capitalize">
              {ride.vehicleType === "bike"
                ? "🏍️ RouteX Moto"
                : ride.vehicleType === "auto"
                ? "🛺 RouteX Auto"
                : ride.vehicleType === "sedan"
                ? "✨ RouteX Premier"
                : ride.vehicleType === "suv"
                ? "🚐 RouteX XL"
                : "🚗 RouteX Go"}
            </span>
            {ride.estimatedFare && (
              <span className="font-medium text-slate-500 text-[11px]">
                Upfront: <strong className="text-slate-900 font-mono font-bold">₹{ride.estimatedFare}</strong>
              </span>
            )}
          </div>

          {/* Route details */}
          <div className="mt-3 space-y-1 rounded-lg bg-slate-50/70 p-2.5 text-xs border border-slate-100">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span className="text-slate-700 font-medium truncate">{ride.pickup?.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              <span className="text-slate-700 font-medium truncate">{ride.destination?.address}</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-3.5">
            {ride.status === "requested" && (
              <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50/50 p-3">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-2xs">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{copy?.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{copy?.description}</p>
                </div>
              </div>
            )}
            {copy && ride.status !== "requested" && (
              <div className="text-xs">
                <p className="font-bold text-slate-900">{copy.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{copy.description}</p>
              </div>
            )}
          </div>

          {/* Driver Card */}
          {ride.driver && (
            <div className="mt-3.5">
              <PersonInfoCard person={ride.driver} roleLabel="Assigned Driver" />
            </div>
          )}

          {/* 4-Digit Ride Start PIN */}
          {ride.status === "accepted" && (
            <div className="mt-3.5 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50/80 via-white to-white p-3 text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-brand-900 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> Start Ride PIN
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Share this PIN with your driver to start the trip:
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                {(ride.otp || String((parseInt(String(ride._id).slice(-4), 16) % 9000) + 1000))
                  .split("")
                  .map((digit, idx) => (
                    <span
                      key={idx}
                      className="flex h-9 w-8 items-center justify-center rounded-lg border border-brand-300 bg-white font-mono text-base font-black text-brand-950 shadow-2xs"
                    >
                      {digit}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* "I've Reached Safely" Confirmation Strip */}
          {(ride.status === "started" || ride.status === "completed") && (
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              {hasConfirmedSafe ? (
                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Safe Arrival Confirmed</span>
                </div>
              ) : (
                <Button
                  fullWidth
                  variant="secondary"
                  size="sm"
                  icon={CheckCircle2}
                  loading={confirmingSafety}
                  onClick={handleQuickReachedSafely}
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-xs font-bold"
                >
                  I've Reached Safely
                </Button>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <RideStatusTimeline currentStatus={ride.status} />
          </div>

          {/* Actions */}
          {ride.status === "requested" && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <Button
                variant="danger"
                size="sm"
                fullWidth
                icon={XCircle}
                loading={cancelling}
                onClick={handleCancel}
              >
                Cancel ride
              </Button>
            </div>
          )}
        </div>

        {ride.status === "completed" && (
          <PaymentPanel rideId={ride._id} onSettled={onCancelled} />
        )}

        {/* Safety Check-In Modal */}
        <SafetyCheckInModal
          open={safetyOpen}
          onClose={() => setSafetyOpen(false)}
          rideId={ride._id}
          trackingToken={ride.trackingToken}
          onStatusChange={checkSafetyStatus}
        />

        {/* Support Report Modal */}
        <SupportReportModal
          open={supportOpen}
          onClose={() => setSupportOpen(false)}
          rideId={ride._id}
          role="rider"
        />

        {/* Share Live Trip Modal */}
        <Modal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          title="Share Live Trip with Family & Friends"
          size="md"
        >
          <div className="space-y-4 pt-1">
            <p className="text-xs text-slate-600 leading-relaxed">
              Anyone with this link can track your live moving vehicle, driver details, and trip status in real-time without needing an account.
            </p>

            {/* Link Copy Box */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-2">
              <div className="truncate font-mono text-xs text-slate-700 select-all">{trackingUrl}</div>
              <Button
                variant={copiedLink ? "primary" : "secondary"}
                size="sm"
                icon={copiedLink ? Check : Copy}
                onClick={handleCopyLink}
                className={`shrink-0 text-xs ${copiedLink ? "bg-emerald-600 text-white" : ""}`}
              >
                {copiedLink ? "Copied" : "Copy"}
              </Button>
            </div>

            {/* Registered Emergency Contacts Direct Share */}
            {emergencyContacts.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-rose-500" /> Your Emergency Contacts
                </span>

                <div className="space-y-2">
                  {emergencyContacts.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {c.relationship} · {c.phone}
                        </div>
                      </div>

                      <a
                        href={`https://wa.me/91${c.phone}?text=${encodeURIComponent(
                          `Hi ${c.name}, I am sharing my live RouteX ride with you. Track my trip here: ${trackingUrl}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Share Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hi, track my live RouteX ride here: ${trackingUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 text-xs font-bold transition-colors shadow-2xs"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Share on WhatsApp</span>
              </a>

              <a
                href={`sms:?&body=${encodeURIComponent(
                  `Track my live RouteX ride: ${trackingUrl}`
                )}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-3 text-xs font-bold transition-colors"
              >
                <Phone className="h-4 w-4 text-brand-400" />
                <span>Share via SMS</span>
              </a>
            </div>
          </div>
        </Modal>
      </div>

      {/* Right Dominant Live Map (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-2.5">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs shadow-xs">
          <div className="flex items-center gap-2 font-medium text-slate-800">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs">
              {ride.status === "accepted"
                ? "Driver is on the way to your pickup location"
                : ride.status === "started"
                ? "Trip in progress · Live route tracking"
                : "Connecting to nearby drivers"}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">Live GPS</span>
        </div>

        <MapView
          center={pickupPoint}
          pickup={pickupPoint}
          destination={destinationPoint}
          driverLocation={driverLocation}
          rideStatus={ride.status}
          className="h-[380px] lg:h-full lg:min-h-[460px] rounded-xl shadow-xs border border-slate-200"
        />
      </div>
    </div>
  );
}
