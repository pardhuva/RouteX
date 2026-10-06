import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Clock, PlayCircle, CheckCircle2, ShieldAlert, KeyRound } from "lucide-react";
import MapView from "../../components/MapView";
import RideStatusTimeline from "../../components/RideStatusTimeline";
import PersonInfoCard from "../../components/PersonInfoCard";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import SupportReportModal from "../../components/SupportReportModal";
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

export default function DriverRideDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
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

  async function handleStart(e) {
    if (e) e.preventDefault();
    if (pin.trim().length !== 4) {
      setPinError("Please enter the 4-digit PIN provided by the rider.");
      return;
    }
    setBusy(true);
    setPinError("");
    try {
      const res = await rideApi.startRide(id, pin.trim());
      setRide(res.data.data.ride);
      showToast("PIN verified! Ride started.", "success");
    } catch (err) {
      const msg = getErrorMessage(err, "Invalid Start PIN. Please check with the passenger.");
      setPinError(msg);
      showToast(msg, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    try {
      const res = await rideApi.completeRide(id);
      setRide(res.data.data.ride);
      showToast("Ride completed.", "success");
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't complete this ride."), "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loader fullScreen label="Loading trip dispatch telemetry..." />;
  if (error) return <ErrorState message={error} onRetry={loadRide} />;
  if (!ride) return null;

  const meta = rideStatusMeta(ride.status);
  const pickupPoint = toLatLng(ride.pickup);
  const destinationPoint = toLatLng(ride.destination);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Console
        </button>
        <button
          type="button"
          onClick={() => setSupportOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-rose-300 hover:text-rose-700 shadow-xs transition"
        >
          <ShieldAlert className="h-4 w-4 text-rose-600" /> Driver SOS & Safety
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 font-mono">
              TRIP TELEMETRY #{ride._id.slice(-6).toUpperCase()}
            </h1>
          </div>
          <p className="mt-0.5 text-xs font-mono text-slate-500">ID: {ride._id}</p>
        </div>
        <Badge label={meta.label} className={meta.badge} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-panel">
            <RideStatusTimeline status={ride.status} />

            <div className="mt-5 space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Pickup</span>
                  <p className="font-medium text-slate-800">{ride.pickup.address}</p>
                </div>
              </div>
              <div className="border-t border-slate-200/60 pt-2 flex items-start gap-2.5">
                <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Destination</span>
                  <p className="font-medium text-slate-800">{ride.destination.address}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 rounded border border-slate-100 p-2.5 font-mono text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-slate-400" /> Requested: {formatDate(ride.requestedAt)}
              </div>
              {ride.acceptedAt && <div className="pl-5">Accepted: {formatDate(ride.acceptedAt)}</div>}
              {ride.startedAt && <div className="pl-5">Started: {formatDate(ride.startedAt)}</div>}
              {ride.completedAt && <div className="pl-5">Completed: {formatDate(ride.completedAt)}</div>}
            </div>

            <div className="mt-4">
              <PersonInfoCard person={ride.rider} roleLabel="Passenger" />
            </div>

            {ride.status === "accepted" && (
              <form onSubmit={handleStart} className="mt-5 space-y-3">
                <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-brand-950">
                    <KeyRound className="h-4 w-4 text-brand-700" />
                    Verify Start PIN
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Ask the passenger for their 4-digit security PIN to unlock ignition & navigation:
                  </p>

                  <div className="mt-3">
                    <input
                      type="text"
                      maxLength={4}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={pin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setPin(val);
                        setPinError("");
                      }}
                      placeholder="• • • •"
                      className="w-full text-center tracking-[0.6em] font-mono text-2xl font-bold rounded-lg border border-brand-300 bg-white py-2 text-brand-950 placeholder-slate-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-xs"
                    />
                    {pinError && (
                      <p className="mt-1.5 text-center text-xs font-semibold text-rose-600">
                        {pinError}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  fullWidth
                  size="lg"
                  type="submit"
                  icon={PlayCircle}
                  loading={busy}
                  disabled={pin.length !== 4}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold"
                >
                  Verify PIN & Start Trip
                </Button>
              </form>
            )}
            {ride.status === "started" && (
              <Button
                fullWidth
                size="lg"
                className="mt-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                icon={CheckCircle2}
                loading={busy}
                onClick={handleComplete}
              >
                Complete Ride & Settle Fare
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <MapView
            center={pickupPoint}
            pickup={pickupPoint}
            destination={destinationPoint}
            driverLocation={driverLocation}
            rideStatus={ride.status}
            className="h-80 w-full rounded-xl border border-slate-200/80 shadow-panel lg:h-full lg:min-h-[460px]"
          />
        </div>
      </div>

      <SupportReportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        rideId={ride._id}
        role="driver"
      />
    </div>
  );
}
