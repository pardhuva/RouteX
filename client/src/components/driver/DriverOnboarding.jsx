import { useState } from "react";
import { Car, ArrowRight, ShieldCheck, Bike, Zap } from "lucide-react";
import Input from "../Input";
import Button from "../Button";
import * as driverApi from "../../services/driverApi";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const VEHICLE_TYPES = [
  { value: "bike", label: "Moto (Bike)", icon: Bike },
  { value: "auto", label: "RouteX Auto", icon: Zap },
  { value: "car", label: "Cab / Sedan", icon: Car },
];

export default function DriverOnboarding({ onComplete }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ vehicleType: "car", brand: "", model: "", registrationNumber: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.brand.trim()) next.brand = "Vehicle make/brand is required";
    if (!form.model.trim()) next.model = "Vehicle model is required";
    if (!form.registrationNumber.trim()) next.registrationNumber = "Vehicle license plate number is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await driverApi.createDriverProfile(form);
      showToast("Driver profile verified & onboarded!", "success");
      onComplete(res.data.data.driver);
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't create your driver profile."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="rounded-xl border border-slate-200/80 bg-white p-7 shadow-panel sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 border border-brand-100">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-slate-950 uppercase tracking-tight">
              Vehicle & Fleet Onboarding
            </h1>
            <p className="text-xs text-slate-500">
              Register your vehicle to start receiving 80% net dispatch pings.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <span className="mb-2 block text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
              Select Fleet Class
            </span>
            <div className="grid grid-cols-3 gap-2">
              {VEHICLE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = form.vehicleType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => update("vehicleType", type.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border py-3 px-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-brand-600 bg-brand-50 text-brand-950 shadow-xs ring-1 ring-brand-600"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? "text-brand-700" : "text-slate-400"}`} />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Make / Brand"
              value={form.brand}
              onChange={(e) => update("brand", e.target.value)}
              error={errors.brand}
              placeholder="e.g. Maruti / Hyundai"
            />
            <Input
              label="Model"
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
              error={errors.model}
              placeholder="e.g. Dzire / i20"
            />
          </div>

          <Input
            label="License Plate Number"
            value={form.registrationNumber}
            onChange={(e) => update("registrationNumber", e.target.value.toUpperCase())}
            error={errors.registrationNumber}
            placeholder="e.g. TS09EA1234 / DL01AB9999"
          />

          <div className="rounded-lg bg-emerald-50/60 p-3 border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>
              RouteX pays out 80% net trip fares with instant weekly bank settlements and automated GPS radius dispatch.
            </span>
          </div>

          <Button type="submit" fullWidth loading={submitting} icon={ArrowRight} className="bg-brand-600 hover:bg-brand-500 font-bold">
            Complete Onboarding & Go Online
          </Button>
        </form>
      </div>
    </div>
  );
}
