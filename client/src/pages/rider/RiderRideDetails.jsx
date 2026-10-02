import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Clock, XCircle, ShieldCheck } from "lucide-react";
import MapView from "../../components/MapView";
import RideStatusTimeline from "../../components/RideStatusTimeline";
import PersonInfoCard from "../../components/PersonInfoCard";
import PaymentPanel from "../../components/rider/PaymentPanel";
import DriverRatingCard from "../../components/rider/DriverRatingCard";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import { useLiveRide } from "../../hooks/useLiveRide";
import { useToast } from "../../context/ToastContext";
import { formatDate } from "../../utils/format";
import { rideStatusMeta } from "../../utils/statusMeta";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";

function toLatLng(point) {
  if (!point?.location?.coordinates) return null;
  const [longitude, latitude] = point.location.coordinates;
  return { latitude, longitude };
}

import SupportReportModal from "../../components/SupportReportModal";
import { ShieldAlert } from "lucide-react";

export default function RiderRideDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const loadRide = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rideApi.getRide(id);
      setRide(res.data.data.ride);
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load this ride."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRide();
  }, [loadRide]);

  const handleRideUpdate = useCallback((updatedRide) => {
    setRide(updatedRide);
  }, []);

  const { driverLocation } = useLiveRide(id, { onRideUpdate: handleRideUpdate });

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await rideApi.cancelRide(id);
      setRide(res.data.data.ride);
      showToast("Ride cancelled.", "info");
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't cancel this ride."), "error");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <Loader fullScreen label="Loading ride details..." />;
  if (error) return <ErrorState message={error} onRetry={loadRide} />;
  if (!ride) return null;

  const meta = rideStatusMeta(ride.status);
  const canCancel = ride.status === "requested" || ride.status === "accepted";
  const pickupPoint = toLatLng(ride.pickup);
  const destinationPoint = toLatLng(ride.destination);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-rose-300 hover:text-rose-600 shadow-xs transition"
        >
          <ShieldAlert className="h-4 w-4 text-rose-500" /> Help & Support
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Ride Details</h1>
          <p className="mt-0.5 text-xs text-slate-400">ID: {ride._id}</p>
        </div>
        <Badge label={meta.label} className={meta.badge} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <RideStatusTimeline status={ride.status} />

            <div className="mt-5 space-y-1.5 rounded-xl bg-slate-50 p-3.5 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="text-slate-600">{ride.pickup.address}</span>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                <span className="text-slate-600">{ride.destination.address}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Requested {formatDate(ride.requestedAt)}
              </div>
              {ride.acceptedAt && <div className="pl-5">Accepted {formatDate(ride.acceptedAt)}</div>}
              {ride.startedAt && <div className="pl-5">Started {formatDate(ride.startedAt)}</div>}
              {ride.completedAt && <div className="pl-5">Completed {formatDate(ride.completedAt)}</div>}
              {ride.cancelledAt && <div className="pl-5">Cancelled {formatDate(ride.cancelledAt)}</div>}
            </div>

            {ride.driver && (
              <div className="mt-4">
                <PersonInfoCard person={ride.driver} roleLabel="Driver" />
              </div>
            )}

            {/* Uber-style 4-Digit Ride Start PIN */}
            {ride.status === "accepted" && (
              <div className="mt-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/95 via-blue-50/60 to-white p-4 text-center shadow-sm">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" /> Start Ride PIN / OTP
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Share this 4-digit code with your driver when you enter the car:
                </p>
                <div className="mt-2.5 flex items-center justify-center gap-2">
                  {(ride.otp || String((parseInt(String(ride._id).slice(-4), 16) % 9000) + 1000))
                    .split("")
                    .map((digit, idx) => (
                      <span
                        key={idx}
                        className="flex h-11 w-10 items-center justify-center rounded-xl border border-indigo-300 bg-white font-mono text-xl font-black text-indigo-950 shadow-sm transition-transform hover:scale-105"
                      >
                        {digit}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {canCancel && (
              <Button fullWidth variant="secondary" className="mt-5" icon={XCircle} loading={cancelling} onClick={handleCancel}>
                Cancel ride
              </Button>
            )}
          </div>

          {ride.status === "completed" && <PaymentPanel rideId={ride._id} />}
        </div>

        <div className="lg:col-span-3">
          <MapView
            center={pickupPoint}
            pickup={pickupPoint}
            destination={destinationPoint}
            driverLocation={driverLocation}
            rideStatus={ride.status}
            className="h-80 w-full lg:h-full lg:min-h-[420px]"
          />

        </div>
      </div>

      <SupportReportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        rideId={ride._id}
        role="rider"
      />
    </div>
  );
}
