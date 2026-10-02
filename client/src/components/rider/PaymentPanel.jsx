import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, CreditCard, ArrowRight, LayoutDashboard } from "lucide-react";
import Button from "../Button";
import Loader from "../Loader";
import Badge from "../Badge";
import { formatCurrency } from "../../utils/format";
import { paymentStatusMeta } from "../../utils/statusMeta";
import * as paymentApi from "../../services/paymentApi";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

// Payment state machine here mirrors the backend exactly (pending -> success
// | failed, both terminal — server/src/services/payment.service.js). There
// is no "cancelled payment" status anywhere in the Day 1-7 backend, so that
// state from the brief is intentionally not built here — see README "Known
// Limitations". Likewise, a failed payment cannot be retried (the unique
// Ride<->Payment index means a second createPayment call just returns the
// same, already-failed, payment) — the failure view reflects that honestly
// instead of offering a retry button that would just 409.
import DriverRatingCard from "./DriverRatingCard";
import * as rideApi from "../../services/rideApi";

export default function PaymentPanel({ rideId, onSettled }) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const idempotencyKeyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function loadOrCreate() {
      setLoading(true);
      setError(null);
      try {
        const [payRes, rideRes] = await Promise.all([
          paymentApi.createPayment(rideId),
          rideApi.getRide(rideId).catch(() => null),
        ]);
        if (!cancelled) {
          setPayment(payRes.data.data.payment);
          if (rideRes?.data?.data?.ride) {
            setRide(rideRes.data.data.ride);
          }
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "We couldn't load the payment for this ride."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadOrCreate();
    return () => {
      cancelled = true;
    };
  }, [rideId]);

  async function handlePay(result) {
    if (!payment) return;
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = paymentApi.generateIdempotencyKey();
    }

    setPaying(true);
    try {
      const res = await paymentApi.simulatePayment(payment._id, {
        result,
        idempotencyKey: idempotencyKeyRef.current,
      });
      setPayment(res.data.data.payment);
      idempotencyKeyRef.current = null;
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't process your payment. Please try again."), "error");
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <Loader label="Preparing payment..." />;
  if (error) return <p className="rounded-xl bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</p>;
  if (!payment) return null;

  const meta = paymentStatusMeta(payment.status);

  if (payment.status === "success") {
    return (
      <div className="space-y-4">
        <div className="animate-fade-in rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-soft">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-lg font-bold text-emerald-800">Payment Successful</h3>
          <p className="mt-0.5 text-xs text-emerald-700">Thank you for riding with RouteX.</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-900">{formatCurrency(payment.amount, payment.currency)}</p>
        </div>

        {ride && (
          <DriverRatingCard
            ride={ride}
            onRatingSubmitted={(updatedRide) => setRide(updatedRide)}
          />
        )}

        <div className="flex flex-col justify-center gap-2.5 sm:flex-row pt-2">
          <Button variant="secondary" onClick={() => onSettled ? onSettled() : navigate("/rider")} icon={LayoutDashboard}>
            Book Next Ride
          </Button>
          <Button onClick={() => navigate("/rider/history")} icon={ArrowRight}>
            View Ride History
          </Button>
        </div>
      </div>
    );
  }

  if (payment.status === "failed") {
    return (
      <div className="animate-fade-in rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-soft">
          <XCircle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-rose-800">Payment Failed</h3>
        <p className="mt-1 text-sm text-rose-700">{payment.failureReason || "The payment could not be completed."}</p>
        <p className="mt-4 text-xs text-rose-600">
          This payment attempt is final. Please contact support to arrange another way to pay for this ride.
        </p>
        <Button variant="secondary" className="mt-5" onClick={() => onSettled ? onSettled() : navigate("/rider")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Ride Completed</h3>
        <Badge label={meta.label} className={meta.badge} />
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fare</p>
        <p className="mt-1 text-3xl font-extrabold text-slate-900">{formatCurrency(payment.amount, payment.currency)}</p>
      </div>

      <Button fullWidth size="lg" className="mt-5" icon={CreditCard} loading={paying} onClick={() => handlePay("success")}>
        Pay Now
      </Button>
      <button
        type="button"
        onClick={() => handlePay("failure")}
        disabled={paying}
        className="mt-3 w-full text-center text-xs font-medium text-slate-400 underline decoration-dotted hover:text-slate-600 disabled:opacity-50"
      >
        Simulate a failed payment (sandbox/test mode)
      </button>
    </div>
  );
}
