"use client";

import Icon from "@/components/Icon";

export default function DestructiveConfirm({
  title,
  description,
  confirmationText,
  value,
  onChange,
  onCancel,
  onConfirm,
  confirming = false,
}: {
  title: string;
  description: React.ReactNode;
  confirmationText: string;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirming?: boolean;
}) {
  const canConfirm = value.trim() === confirmationText;
  return (
    <div className="rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6] p-4" role="alertdialog" aria-modal="true" aria-labelledby="destructive-confirm-title">
      <div className="mb-3 flex items-center gap-2 text-[#ba1a1a]">
        <Icon name="warning" className="text-[20px]" />
        <h3 id="destructive-confirm-title" className="text-[14px] font-bold">{title}</h3>
      </div>
      <div className="text-[12px] text-[#5a1a16]">{description}</div>
      <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-[#5a1a16]" htmlFor="destructive-confirm-input">
        Type {confirmationText} to continue
      </label>
      <input
        id="destructive-confirm-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-[#ba1a1a]/30 bg-white px-3 py-2 text-[13px] outline-none focus:border-[#ba1a1a]"
        autoComplete="off"
      />
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-[#c6c6cf] bg-white py-2 text-[12px] font-semibold text-[#45464e] hover:bg-[#f2f4f6]">
          Cancel
        </button>
        <button type="button" onClick={onConfirm} disabled={!canConfirm || confirming} className="flex-1 rounded-lg bg-[#ba1a1a] py-2 text-[12px] font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {confirming ? "Deleting..." : "Confirm delete"}
        </button>
      </div>
    </div>
  );
}
