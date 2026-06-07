import { useEffect } from "react";
import {
  useAppStore,
  ACHIEVEMENTS,
  LEVELS,
  type Toast,
} from "../state/store";

const DURATION_MS = 4500;

const ICON_ACHIEVEMENT = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
  </svg>
);

const ICON_LEVEL = (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="5,15 12,8 19,15" />
    <line x1="5" y1="19" x2="19" y2="19" />
  </svg>
);

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useAppStore((s) => s.dismissToast);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dismiss]);

  if (toast.type === "cc") {
    return (
      <div
        className="toast toast-cc"
        onClick={() => dismiss(toast.id)}
        role="status"
      >
        <div className="toast-cc-amount">+{toast.amount} CC</div>
        {toast.reason && <div className="toast-cc-reason">{toast.reason}</div>}
      </div>
    );
  }

  if (toast.type === "achievement") {
    const ach = ACHIEVEMENTS[toast.achievementId];
    if (!ach) return null;
    return (
      <div
        className="toast toast-achievement"
        onClick={() => dismiss(toast.id)}
        role="status"
      >
        <div className="toast-icon">{ICON_ACHIEVEMENT}</div>
        <div className="toast-body">
          <div className="toast-headline">Achievement freigeschaltet</div>
          <div className="toast-title">{ach.name}</div>
          <div className="toast-sub">{ach.description}</div>
        </div>
      </div>
    );
  }

  if (toast.type === "level") {
    const level = LEVELS.find((l) => l.id === toast.levelId);
    if (!level) return null;
    return (
      <div
        className="toast toast-level"
        onClick={() => dismiss(toast.id)}
        role="status"
      >
        <div className="toast-icon">{ICON_LEVEL}</div>
        <div className="toast-body">
          <div className="toast-headline">Level Up</div>
          <div className="toast-title">{level.label}</div>
          <div className="toast-sub">Du bist eine Stufe aufgestiegen.</div>
        </div>
      </div>
    );
  }

  return null;
}
