import { useEffect, useState } from "react";

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = requestAnimationFrame(() => setVisible(true));

    // Start exit animation slightly before removal
    const exitTimer = setTimeout(() => setVisible(false), 2600);
    const removeTimer = setTimeout(() => onRemove(toast.id), 3000);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, onRemove]);

  const isSuccess = toast.type === "success";

  return (
    <div
      role="alert"
      style={{
        transition: "opacity 0.35s ease, transform 0.35s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(100%)"
      }}
      className={[
        "flex items-start gap-3 rounded-xl px-4 py-3 shadow-xl max-w-xs w-full pointer-events-auto",
        isSuccess
          ? "bg-emerald-600 text-white"
          : "bg-red-600 text-white"
      ].join(" ")}
    >
      <span className="mt-0.5 text-lg select-none">
        {isSuccess ? "✓" : "✕"}
      </span>
      <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="ml-1 opacity-70 hover:opacity-100 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
