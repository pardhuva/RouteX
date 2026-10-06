import { useState } from "react";
import { ShieldAlert, AlertTriangle, PhoneCall, CheckCircle2, HelpCircle, X } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import * as supportApi from "../services/supportApi";
import { getErrorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

const CATEGORIES_RIDER = [
  { id: "driver_behavior", label: "Driver Misconduct / Rude Behavior", urgency: "medium" },
  { id: "rash_driving", label: "Rash / Unsafe Driving", urgency: "high" },
  { id: "overcharging", label: "Demanded Extra Cash / Overcharging", urgency: "medium" },
  { id: "vehicle_condition", label: "Vehicle Issue / AC Not Working", urgency: "low" },
  { id: "emergency_safety", label: "Safety Emergency / Harassment (Urgent)", urgency: "critical" },
  { id: "lost_item", label: "Lost Belongings in Car", urgency: "low" },
  { id: "other", label: "Other Trip Issue", urgency: "medium" },
];

const CATEGORIES_DRIVER = [
  { id: "rider_escaped_unpaid", label: "Passenger Escaped Without Paying", urgency: "high" },
  { id: "driver_behavior", label: "Passenger Rude / Abusive Behavior", urgency: "medium" },
  { id: "vehicle_condition", label: "Passenger Damaged or Soiled Vehicle", urgency: "medium" },
  { id: "emergency_safety", label: "Physical Safety Emergency", urgency: "critical" },
  { id: "other", label: "Other Ride Issue", urgency: "medium" },
];

export default function SupportReportModal({ open, onClose, rideId, role = "rider" }) {
  const { showToast } = useToast();
  const [category, setCategory] = useState(role === "rider" ? "driver_behavior" : "rider_escaped_unpaid");
  const [urgency, setUrgency] = useState("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState(null);

  const categories = role === "driver" ? CATEGORIES_DRIVER : CATEGORIES_RIDER;

  function handleCategoryChange(catId) {
    setCategory(catId);
    const selected = categories.find((c) => c.id === catId);
    if (selected) {
      setUrgency(selected.urgency);
    }
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      showToast("Please provide at least a short description of what occurred.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await supportApi.reportIncident({
        rideId,
        category,
        urgency,
        description: description.trim(),
      });

      setTicket(res.data.data.incident);
      showToast("Report submitted. Trust & Safety team notified.", "success");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to submit report. Please try again."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setTicket(null);
    setDescription("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Trip Safety & Incident Support">
      {ticket ? (
        <div className="text-center py-4 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-soft">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Incident Ticket Raised</h3>
            <p className="mt-1 text-xs text-slate-500">
              Reference ID: <span className="font-mono font-bold text-slate-800">{ticket._id}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-bold text-slate-800 capitalize">{ticket.category.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-bold text-amber-600 uppercase tracking-wide">{ticket.status}</span>
            </div>
            <p className="mt-2 text-slate-600 text-[11px] pt-2 border-t border-slate-200">
              Our Trust & Safety response unit is investigating this incident. If urgent action is required, our team will reach out to you via your registered phone.
            </p>
          </div>
          <Button fullWidth onClick={handleClose} className="bg-slate-900 text-white font-bold">
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emergency Helpline Banner */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <span className="font-extrabold">Immediate danger or harassment?</span>
                <p className="text-[11px] text-rose-600">Dial National Emergency Police Support</p>
              </div>
            </div>
            <a
              href="tel:112"
              className="inline-flex items-center gap-1 shrink-0 rounded-xl bg-rose-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 text-xs"
            >
              <PhoneCall className="h-3.5 w-3.5" /> Call 112
            </a>
          </div>

          {/* Issue Category */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Issue Category
            </label>
            <div className="mt-2 space-y-1.5">
              {categories.map((c) => {
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCategoryChange(c.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-brand-600 bg-brand-50 text-brand-900 shadow-xs ring-1 ring-brand-500"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span>{c.label}</span>
                    {c.urgency === "critical" && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase text-rose-700">
                        Urgent
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Describe What Happened
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details (e.g. driver demanded extra ₹100, vehicle registration TS09AB..., location)..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={submitting}
              icon={AlertTriangle}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
