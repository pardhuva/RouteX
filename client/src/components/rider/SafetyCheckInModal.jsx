import { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Clock,
  Phone,
  PhoneCall,
  Loader2,
  Navigation,
  Share2,
  MessageCircle,
} from "lucide-react";
import Modal from "../Modal";
import Button from "../Button";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";

const ALERT_TYPES = [
  { id: "rider_unsafe", label: "Unsafe Driving / Behavior", desc: "Driver driving recklessly, speeding, or behaving inappropriately." },
  { id: "route_deviation", label: "Off-Route / Suspicious Deviation", desc: "Vehicle taking an unexpected or unauthorized route." },
  { id: "sos", label: "Immediate Emergency / SOS", desc: "Urgent distress requiring prompt operations intervention." },
  { id: "safety_checkin_missed", label: "General Safety Concern", desc: "You feel uncomfortable and request operations monitoring." },
];

export default function SafetyCheckInModal({ open, onClose, rideId, trackingToken, onStatusChange }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedType, setSelectedType] = useState("rider_unsafe");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [fetchingStatus, setFetchingStatus] = useState(false);

  useEffect(() => {
    if (open && rideId) {
      setConfirmStep(false);
      setDescription("");
      setFetchingStatus(true);
      rideApi
        .getRideSafetyStatus(rideId)
        .then((res) => {
          if (res.data?.data?.hasActiveAlert) {
            setActiveAlert(res.data.data.activeAlert);
          } else {
            setActiveAlert(null);
          }
        })
        .catch(() => {})
        .finally(() => setFetchingStatus(false));
    }
  }, [open, rideId]);

  async function handleTriggerAlert() {
    setLoading(true);
    try {
      const res = await rideApi.triggerSafetyAlert(rideId, {
        alertType: selectedType,
        description,
      });
      const alert = res.data?.data?.alert;
      setActiveAlert(alert);
      setConfirmStep(false);
      showToast("Safety alert triggered. Central Safety Operations team has been notified.", "success");
      if (onStatusChange) onStatusChange(alert);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to trigger safety alert. Please try again."), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSafety() {
    setLoading(true);
    try {
      const res = await rideApi.confirmSafety(rideId);
      setActiveAlert(null);
      showToast("Safe arrival confirmed. Thank you!", "success");
      if (onStatusChange) onStatusChange(res.data?.data?.alert);
      onClose();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to record safe check-in."), "error");
    } finally {
      setLoading(false);
    }
  }

  const emergencyContacts = user?.emergencyContacts || [];
  const trackingUrl = `${window.location.origin}/track/${trackingToken || rideId}`;

  return (
    <Modal open={open} onClose={onClose} title="" size="md">
      <div className="space-y-4">
        {/* Header Strip */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeAlert ? "bg-rose-100 text-rose-600" : "bg-brand-50 text-brand-600"}`}>
            {activeAlert ? <ShieldAlert className="h-5 w-5 animate-pulse text-rose-600" /> : <ShieldCheck className="h-5 w-5 text-brand-600" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {activeAlert ? "Safety Alert Active" : "Rider Safety & Emergency Shield"}
            </h3>
            <p className="text-xs text-slate-500">
              {activeAlert ? "Your ride is currently flagged under active monitoring." : "24/7 dedicated safety response and real-time ride tracking."}
            </p>
          </div>
        </div>

        {fetchingStatus ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : activeAlert ? (
          /* Active Alert State */
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2 py-0.5 text-xs font-bold text-white shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE ALERT ACTIVE
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(activeAlert.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-rose-950 font-medium leading-relaxed pt-1">
                Our Central Operations Desk is monitoring your trip telemetry. Your live GPS coordinates and vehicle details are actively logged.
              </p>
            </div>

            {/* Quick Emergency Actions Bar */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-3 text-xs font-bold transition-colors shadow-sm"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Call 112 (Police)</span>
              </a>

              {emergencyContacts.length > 0 ? (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `🚨 SAFETY ALERT: I triggered an emergency alert on my RouteX ride. Track my live location here: ${trackingUrl}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 text-xs font-bold transition-colors shadow-sm"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp Family</span>
                </a>
              ) : (
                <a
                  href={`tel:108`}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 py-2.5 px-3 text-xs font-bold transition-colors"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
                  <span>Call 108 (Ambulance)</span>
                </a>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Alert Type:</span>
                <strong className="text-slate-900 capitalize">{activeAlert.alertType?.replace("_", " ")}</strong>
              </div>
              {activeAlert.description && (
                <div className="text-slate-600 pt-1 border-t border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Note provided:</span>
                  <p className="text-slate-800 italic mt-0.5">"{activeAlert.description}"</p>
                </div>
              )}
            </div>

            {/* Reached Safely Check-in Action */}
            <div className="pt-2">
              <Button
                fullWidth
                variant="primary"
                size="md"
                icon={CheckCircle2}
                loading={loading}
                onClick={handleConfirmSafety}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 shadow-sm"
              >
                I've Reached Safely · Close Alert
              </Button>
            </div>
          </div>
        ) : !confirmStep ? (
          /* Trigger Form */
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50/60 p-3 border border-blue-100 text-xs text-blue-900 leading-relaxed">
              <strong>How this works:</strong> Triggering an alert flags your ride on our central monitoring system and provides 1-tap live link sharing with your family.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                What is your primary concern?
              </label>
              <div className="space-y-2">
                {ALERT_TYPES.map((type) => (
                  <label
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                      selectedType === type.id
                        ? "border-rose-400 bg-rose-50/60 ring-1 ring-rose-400/40"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="alertType"
                      checked={selectedType === type.id}
                      onChange={() => setSelectedType(type.id)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900">{type.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{type.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Driver missed the turn on main road and is speeding..."
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={ShieldAlert}
                onClick={() => setConfirmStep(true)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Continue to Alert
              </Button>
            </div>
          </div>
        ) : (
          /* Confirmation Safeguard Step */
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-rose-950">Confirm Safety Alert</h4>
              <p className="text-xs text-rose-800 leading-relaxed max-w-sm mx-auto">
                Are you sure you want to trigger a safety alert? Our safety operations team will immediately receive your trip details and live GPS coordinates.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setConfirmStep(false)}
                className="flex-1"
                disabled={loading}
              >
                Go Back
              </Button>
              <Button
                variant="danger"
                size="md"
                icon={ShieldAlert}
                loading={loading}
                onClick={handleTriggerAlert}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 shadow-sm"
              >
                Yes, Trigger Alert
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
