// ============================================================
// src/hooks/useToast.js
// Simple toast notification hook
// ============================================================
import { useState } from "react";

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const hide = () => setToast(null);

  return { toast, show, hide };
}
