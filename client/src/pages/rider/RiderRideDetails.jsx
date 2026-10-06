import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Clock, XCircle, ShieldCheck, ShieldAlert } from "lucide-react";
import MapView from "../../components/MapView";
import RideStatusTimeline from "../../components/RideStatusTimeline";
import PersonInfoCard from "../../components/PersonInfoCard";
import PaymentPanel from "../../components/rider/PaymentPanel";
import SupportReportModal from "../../components/SupportReportModal";
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
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Trips
        </button>
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:border-rose-300 hover:text-rose-600 shadow-2xs transition"
        >
          <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> Support Assistance
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">Trip Summary</h1>
          <p className="mt-0.5 font-mono text-[11px] text-slate-400">ID: {ride._id}</p>
        </div>
        <Badge label={meta.label} className={meta.badge} />
      </div>

      <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            <RideStatusTimeline status={ride.status} />

            <div className="mt-4 space-y-1 rounded-lg bg-slate-50 p-3 text-xs border border-slate-100">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="text-slate-700 font-medium">{ride.pickup?.address}</span>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                <span className="text-slate-700 font-medium">{ride.destination?.address}</span>
              </div>
            </div>

            <div className="mt-3.5 space-y-1.5 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" /> Requested: {formatDate(ride.requestedAt)}
              </div>
              {ride.acceptedAt && <div className="pl-5">Accepted: {formatDate(ride.acceptedAt)}</div>}
              {ride.startedAt && <div className="pl-5">Started: {formatDate(ride.startedAt)}</div>}
              {ride.completedAt && <div className="pl-5">Completed: {formatDate(ride.completedAt)}</div>}
              {ride.cancelledAt && <div className="pl-5">Cancelled: {formatDate(ride.cancelledAt)}</div>}
            </div>

            {ride.driver && (
              <div className="mt-4">
                <PersonInfoCard person={ride.driver} roleLabel="Driver" />
              </div>
            )}

            {ride.status === "accepted" && (
              <div className="mt-3.5 rounded-xl border border-brand-200 bg-brand-50/50 p-3 text-center shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-brand-900 uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> Start Ride PIN
                </div>
                <div className="mt-1.5 flex items-center justify-center gap-1.5">
                  {(ride.otp || String((parseInt(String(ride._id).slice(-4), 16) % 9000) + 1000))
                    .split("")
                    .map((digit, idx) => (
                      <span
                        key={idx}
                        className="flex h-8 w-7 items-center justify-center rounded-md border border-brand-300 bg-white font-mono text-base font-black text-brand-950 shadow-2xs"
                      >
                        {digit}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {canCancel && (
              <Button
                fullWidth
                variant="secondary"
                size="sm"
                className="mt-4 text-slate-700"
                icon={XCircle}
                loading={cancelling}
                onClick={handleCancel}
              >
                Cancel ride
              </Button>
            )}
          </div>

          {ride.status === "completed" && <PaymentPanel rideId={ride._id} />}
        </div>

        <div className="lg:col-span-7 h-[380px] lg:h-full lg:min-h-[440px]">
          <MapView
            center={pickupPoint}
            pickup={pickupPoint}
            destination={destinationPoint}
            driverLocation={driverLocation}
            rideStatus={ride.status}
            className="h-full w-full rounded-xl shadow-xs border border-slate-200"
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
