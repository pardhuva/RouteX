import { useState } from "react";
import { Search, Info, KeyRound } from "lucide-react";
import Input from "../Input";
import Button from "../Button";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

export default function AcceptByIdCard({ onAccepted }) {
  const { showToast } = useToast();
  const [rideId, setRideId] = useState("");
  const [accepting, setAccepting] = useState(false);

  async function handleAccept(e) {
    e.preventDefault();
    if (!rideId.trim()) return;

    setAccepting(true);
    try {
      const res = await rideApi.acceptRide(rideId.trim());
      showToast("Trip dispatch accepted!", "success");
      onAccepted(res.data.data.ride);
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't accept that ride ID."), "error");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
      <div className="flex items-start gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            Manual Dispatch Override (Fallback ID)
          </span>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            If you missed a radar ping or are pairing directly with a passenger, paste their RouteX Trip ID below to bind this vehicle.
          </p>
        </div>
      </div>
      <form onSubmit={handleAccept} className="mt-3 flex gap-2">
        <Input
          value={rideId}
          onChange={(e) => setRideId(e.target.value)}
          placeholder="Paste MongoDB Ride ID (e.g. 660f...)"
          className="flex-1 font-mono text-xs"
        />
        <Button
          type="submit"
          icon={KeyRound}
          loading={accepting}
          disabled={!rideId.trim()}
          className="bg-slate-900 text-white font-mono text-xs hover:bg-slate-800 shrink-0"
        >
          Override & Accept
        </Button>
      </form>
    </div>
  );
}
