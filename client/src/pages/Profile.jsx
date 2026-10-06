import { useEffect, useState } from "react";
import { Mail, Phone, Shield, Car, Calendar, UserCheck, Pencil, Check, X, User } from "lucide-react";
import Loader from "../components/Loader";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { initials, formatShortDate } from "../utils/format";
import { driverStatusMeta } from "../utils/statusMeta";
import * as driverApi from "../services/driverApi";
import * as authApi from "../services/authApi";
import { getErrorMessage } from "../services/api";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [driver, setDriver] = useState(null);
  const [driverLoading, setDriverLoading] = useState(user.role === "driver");

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: user.name || "", phone: user.phone || "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user.role !== "driver") return;
    driverApi
      .getMyDriverProfile()
      .then((res) => setDriver(res.data.data.driver))
      .catch(() => setDriver(null))
      .finally(() => setDriverLoading(false));
  }, [user.role]);

  function handleOpenEdit() {
    setEditForm({ name: user.name || "", phone: user.phone || "" });
    setErrors({});
    setIsEditing(true);
  }

  function validate() {
    const next = {};
    if (!editForm.name.trim()) next.name = "Full name is required";
    if (!/^[0-9]{10}$/.test(editForm.phone)) next.phone = "Phone number must be a valid 10-digit number";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await authApi.updateProfile({
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
      });
      const updated = res.data.data.user;
      updateUser(updated);
      showToast("Profile updated successfully", "success");
      setIsEditing(false);
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to update profile. Please check your inputs."), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Account Profile</h1>
          <p className="mt-0.5 text-xs text-slate-500">Manage your personal details and account settings</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            label={user.role === "admin" ? "Admin" : user.role === "driver" ? "Driver Partner" : "Rider"}
            variant={user.role === "admin" ? "rose" : user.role === "driver" ? "brand" : "emerald"}
            className="text-xs font-semibold capitalize"
          />
          <button
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-500" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold text-lg border border-brand-200">
              {initials(user.name)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified Account
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
          <div className="flex items-center justify-between py-3.5">
            <dt className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>Email address</span>
            </dt>
            <dd className="text-xs font-medium text-slate-900">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <dt className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>Mobile number</span>
            </dt>
            <dd className="text-xs font-medium text-slate-900">{user.phone || "Not provided"}</dd>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <dt className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              <span>Account role</span>
            </dt>
            <dd className="text-xs font-semibold capitalize text-brand-700">{user.role}</dd>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <dt className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Member since</span>
            </dt>
            <dd className="text-xs text-slate-700">{formatShortDate(user.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Driver Vehicle Card if Driver */}
      {user.role === "driver" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Car className="h-4 w-4 text-brand-600" /> Assigned Vehicle
            </h2>
            {driver && (
              <Badge label={driverStatusMeta(driver.status).label} className={`${driverStatusMeta(driver.status).badge} text-xs`} />
            )}
          </div>

          {driverLoading ? (
            <div className="py-6">
              <Loader label="Loading vehicle details..." />
            </div>
          ) : driver ? (
            <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Vehicle model</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {driver.vehicle?.brand} {driver.vehicle?.model}
                </p>
                <p className="text-xs text-slate-600 capitalize mt-0.5">{driver.vehicle?.vehicleType} category</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Registration number</p>
                <p className="text-xs font-semibold text-slate-900 mt-1 bg-white px-2.5 py-1 rounded border border-slate-200 w-fit">
                  {driver.vehicle?.registrationNumber || "Not assigned"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">No vehicle information registered yet.</p>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full name
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => {
                  setEditForm((prev) => ({ ...prev, name: e.target.value }));
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Your full name"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mobile number (10 digits)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={editForm.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setEditForm((prev) => ({ ...prev, phone: val }));
                  setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                placeholder="10-digit mobile number"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Email address cannot be changed directly.</p>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

