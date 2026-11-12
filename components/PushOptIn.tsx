"use client";

import { useEffect, useState } from "react";

const b64 = (s: string) => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};

export default function PushOptIn() {
  const [state, setState] = useState<"loading" | "unsupported" | "ios-install" | "off" | "on" | "denied">("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
      if (ios && !standalone) return setState("ios-install");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })();
  }, []);

  const turnOn = async () => {
    setBusy(true); setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState(perm === "denied" ? "denied" : "off"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
      const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) throw new Error();
      setState("on");
    } catch { setMsg("Could not turn on notifications. Please try again."); }
    setBusy(false);
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off");
    } catch { setMsg("Could not turn off notifications."); }
    setBusy(false);
  };

  if (state === "loading" || state === "unsupported") return null;

  return (
    <div className="rounded-2xl border border-[#c6c6cf] bg-white p-5 text-center">
      <p className="text-[15px] font-bold text-[#081534]">A word of hope, daily</p>
      <p className="mt-1 text-[13px] text-[#45464e]">Get a short scripture or encouragement on your phone.</p>
      {state === "ios-install" && (
        <p className="mt-3 text-[13px] text-[#45464e]">On iPhone: tap Share, then “Add to Home Screen”, open the app from there, and come back to this button.</p>
      )}
      {state === "denied" && <p className="mt-3 text-[13px] text-[#45464e]">Notifications are blocked. Allow them for this site in your browser settings.</p>}
      {state === "off" && (
        <button onClick={turnOn} disabled={busy} className="mt-3 rounded-full bg-[#081534] px-6 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">
          {busy ? "Turning on..." : "Get daily encouragement"}
        </button>
      )}
      {state === "on" && (
        <>
          <p className="mt-3 text-[13px] font-semibold text-green-800">You’re subscribed.</p>
          <button onClick={turnOff} disabled={busy} className="mt-2 text-[12px] font-semibold text-[#45464e] underline">Turn off</button>
        </>
      )}
      {msg && <p role="alert" className="mt-2 text-[12px] text-[#ba1a1a]">{msg}</p>}
    </div>
  );
}