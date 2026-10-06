import { useCallback, useState } from "react";
import { MapPin, Navigation, X, Check, Clock, ShieldCheck, User } from "lucide-react";
import Modal from "../Modal";
import Button from "../Button";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useSocketEvent } from "../../hooks/useSocketEvent";

export default function IncomingRideRequestModal({ request, onAccepted, onDismiss }) {
  const { showToast } = useToast();
  const [processing, setProcessing] = useState(false);

  useSocketEvent(
    "ride_claimed",
    useCallback(
      (payload) => {
        if (request && String(request.rideId) === String(payload.rideId)) {
          if (payload.status === "cancelled") {
            showToast("Ride request was cancelled by the passenger.", "info");
          }
          onDismiss();
        }
      },
      [request, onDismiss, showToast]
    )
  );

  useSocketEvent(
    "ride_status_updated",
    useCallback(
      (payload) => {
        if (request && String(request.rideId) === String(payload.rideId)) {
          if (payload.status === "cancelled") {
            showToast("Ride request was cancelled by the passenger.", "info");
            onDismiss();
          } else if (payload.status === "accepted") {
            onDismiss();
          }
        }
      },
      [request, onDismiss, showToast]
    )
  );

  if (!request) return null;

  const grossFare = request.estimatedFare || request.fare || 80;
  const netEarnings = Math.round(grossFare * 0.8 * 100) / 100;

  async function handleAccept() {
    setProcessing(true);
    try {
      const res = await rideApi.acceptRide(request.rideId);
      onAccepted(res.data.data.ride);
    } catch (err) {
      showToast(getErrorMessage(err, "This ride request is no longer available."), "error");
      onDismiss();
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Modal open={Boolean(request)} onClose={onDismiss} title="Incoming Ride Dispatch" size="md">
      <div className="space-y-3.5">
        {/* Urgent High-Contrast Header */}
        <div className="flex items-center justify-between rounded-lg bg-slate-900 p-3.5 text-white">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Driver Payout (80%)</div>
            <div className="text-2xl font-black text-emerald-400">₹{netEarnings}</div>
          </div>
          <div className="text-right">
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-200 border border-slate-700">
              Immediate Dispatch
            </span>
            <div className="text-[10px] text-slate-400 mt-1">Gross Fare: ₹{grossFare}</div>
          </div>
        </div>

        {/* Rider Info */}
        {request.rider?.name && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 px-1">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>Passenger: {request.rider.name}</span>
          </div>
        )}

        {/* Route Points */}
        <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-xs border border-slate-200">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location</div>
              <div className="font-semibold text-slate-900">{request.pickup?.address}</div>
            </div>
          </div>
          <div className="border-t border-slate-200/60 pt-2 flex items-start gap-2">
            <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Drop-off Destination</div>
              <div className="font-semibold text-slate-900">{request.destination?.address}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2 pt-2 border-t border-slate-100">
        <Button variant="secondary" size="md" fullWidth icon={X} onClick={onDismiss} disabled={processing}>
          Decline
        </Button>
        <Button
          variant="dark"
          size="md"
          fullWidth
          icon={Check}
          loading={processing}
          onClick={handleAccept}
          className="font-bold bg-emerald-700 hover:bg-emerald-600 text-white"
        >
          Accept (Earn ₹{netEarnings})
        </Button>
      </div>
    </Modal>
  );
}
