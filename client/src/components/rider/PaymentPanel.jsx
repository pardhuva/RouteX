import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, CreditCard, ArrowRight, LayoutDashboard } from "lucide-react";
import Button from "../Button";
import Loader from "../Loader";
import Badge from "../Badge";
import DriverRatingCard from "./DriverRatingCard";
import { formatCurrency } from "../../utils/format";
import { paymentStatusMeta } from "../../utils/statusMeta";
import * as paymentApi from "../../services/paymentApi";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

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

  if (loading) return <Loader label="Preparing payment invoice..." />;
  if (error) return <p className="rounded-xl bg-rose-50 p-3.5 text-xs font-medium text-rose-700">{error}</p>;
  if (!payment) return null;

  const meta = paymentStatusMeta(payment.status);

  if (payment.status === "success") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 text-center shadow-xs">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="mt-2 text-base font-extrabold text-emerald-900">Payment Settled</h3>
          <p className="text-xs text-emerald-700">Thank you for riding with RouteX.</p>
          <p className="mt-1.5 text-2xl font-black text-emerald-950">{formatCurrency(payment.amount, payment.currency)}</p>
        </div>

        {ride && (
          <DriverRatingCard
            ride={ride}
            onRatingSubmitted={(updatedRide) => setRide(updatedRide)}
          />
        )}

        <div className="flex flex-col justify-center gap-2 sm:flex-row pt-1">
          <Button variant="secondary" size="sm" onClick={() => onSettled ? onSettled() : navigate("/rider")} icon={LayoutDashboard}>
            Book Next Ride
          </Button>
          <Button size="sm" onClick={() => navigate("/rider/history")} icon={ArrowRight}>
            View Ride History
          </Button>
        </div>
      </div>
    );
  }

  if (payment.status === "failed") {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-center shadow-xs">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white shadow-xs">
          <XCircle className="h-5 w-5" />
        </div>
        <h3 className="mt-2 text-base font-bold text-rose-900">Payment Unsuccessful</h3>
        <p className="mt-1 text-xs text-rose-700">{payment.failureReason || "The payment could not be processed."}</p>
        <p className="mt-3 text-[11px] text-rose-600">
          Please contact 24/7 customer support to arrange another payment method.
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => onSettled ? onSettled() : navigate("/rider")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Ride Completed</h3>
        <Badge label={meta.label} className={meta.badge} />
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 p-3.5 text-center border border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Fare Invoice</p>
        <p className="mt-0.5 text-2xl font-black text-slate-900">{formatCurrency(payment.amount, payment.currency)}</p>
      </div>

      <Button
        fullWidth
        size="lg"
        variant="dark"
        className="mt-4 font-bold shadow-xs"
        icon={CreditCard}
        loading={paying}
        onClick={() => handlePay("success")}
      >
        Pay Now ({formatCurrency(payment.amount, payment.currency)})
      </Button>
      <button
        type="button"
        onClick={() => handlePay("failure")}
        disabled={paying}
        className="mt-2.5 w-full text-center text-[10px] font-medium text-slate-400 hover:text-slate-600 underline disabled:opacity-50"
      >
        Simulate failed payment (sandbox mode)
      </button>
    </div>
  );
}
