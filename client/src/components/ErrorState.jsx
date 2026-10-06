import { AlertCircle } from "lucide-react";
import Button from "./Button";

export default function ErrorState({ message = "Something went wrong. Please try again.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/40 px-6 py-10 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-rose-200 text-rose-500 shadow-xs">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="max-w-md text-xs font-medium text-rose-700">{message}</p>
      {onRetry && (
        <div className="mt-1">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
