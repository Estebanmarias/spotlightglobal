"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const inputClass =
  "w-full bg-[#eceef0] border-0 border-b border-[#c6c6cf] focus:border-[#081534] focus:ring-0 px-4 py-3 text-[14px] sm:text-[15px] text-[#191c1e] transition-all outline-none font-[Plus_Jakarta_Sans]";

const labelClass =
  "block text-[13px] sm:text-[14px] font-semibold text-[#45464e] mb-2 tracking-wide";

export default function ConnectForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    dob: "",
    guest_status: "First_Timer",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      // Pass first name to success page via query param
      router.push(`/success?name=${encodeURIComponent(data.first_name)}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-[#f7f9fb] p-5 sm:p-8 md:p-10 lg:p-12 rounded-xl shadow-2xl"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Row 1: First + Last */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
        >
          <div className="min-w-0">
            <label className={labelClass}>First Name</label>
            <input
              name="first_name"
              type="text"
              placeholder="Spotlight"
              className={inputClass}
              value={form.first_name}
              onChange={handleChange}
            />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>Last Name</label>
            <input
              name="last_name"
              type="text"
              placeholder="Church"
              className={inputClass}
              value={form.last_name}
              onChange={handleChange}
            />
          </div>
        </motion.div>

        {/* Email */}
        <motion.div variants={fadeUp}>
          <label className={labelClass}>Email</label>
          <input
            name="email"
            type="email"
            placeholder="spotlightglobal@example.com"
            className={inputClass}
            value={form.email}
            onChange={handleChange}
          />
        </motion.div>

        {/* Row 2: Phone + DOB */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
        >
          <div className="min-w-0">
            <label className={labelClass}>Phone</label>
            <input
              name="phone"
              type="tel"
              placeholder="+234 00 0000 0000"
              className={inputClass}
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>Date of Birth</label>
            <input
              name="dob"
              type="date"
              className={inputClass}
              value={form.dob}
              onChange={handleChange}
            />
          </div>
        </motion.div>

        {/* Guest Status — matches current 3-tier schema (First_Timer / Attending / Member) */}
        <motion.div variants={fadeUp}>
          <label className={labelClass}>Guest Type</label>
          <select
            name="guest_status"
            className={inputClass}
            value={form.guest_status}
            onChange={handleChange}
          >
            <option value="First_Timer">First Time Guest</option>
            <option value="Attending">Regularly Attending</option>
            <option value="Member">Interested in Membership</option>
          </select>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.p
            variants={fadeUp}
            className="text-[#ba1a1a] text-sm font-medium"
          >
            {error}
          </motion.p>
        )}

        {/* Submit */}
        <motion.button
          variants={fadeUp}
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-[#081534] text-white py-3 sm:py-4 rounded-lg text-[13px] sm:text-[14px] font-bold tracking-wide shadow-lg hover:brightness-110 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Registering..." : "Register Your Presence"}
        </motion.button>
      </form>
    </motion.div>
  );
}
