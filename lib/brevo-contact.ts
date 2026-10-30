const toBrevoSms = (raw: string) => {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return `234${digits}`;
};

export async function pushMemberToBrevo(m: {
  email: string; firstName: string; lastName: string; phone: string; dob: string; status: "Attending" | "Member";
}) {
  const key = process.env.BREVO_API_KEY;
  if (!key) return false;

  const statusList = Number(m.status === "Member" ? process.env.BREVO_LIST_ID_MEMBER : process.env.BREVO_LIST_ID_ATTENDING);
  const listIds = [Number(process.env.BREVO_LIST_ID), statusList].filter((n) => Number.isFinite(n) && n > 0);

  const post = async (withSms: boolean) =>
    fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": key },
      body: JSON.stringify({
        email: m.email,
        listIds,
        updateEnabled: true,
        attributes: {
          FIRSTNAME: m.firstName,
          LASTNAME: m.lastName,
          DOB: m.dob,
          GUEST_STATUS: m.status,
          ...(withSms ? { SMS: toBrevoSms(m.phone) } : {}),
        },
      }),
    });

  try {
    let res = await post(true);
    if (!res.ok) {
      const body = await res.text();
      console.error("[BREVO ERROR]", res.status, body);
      // A phone number already on another contact can make Brevo reject the whole contact.
      // Retry without it so the person still gets added and receives the automations.
      if (res.status === 400 && /sms|duplicate/i.test(body)) {
        res = await post(false);
        if (!res.ok) console.error("[BREVO ERROR retry]", res.status, await res.text());
      }
    }
    return res.ok;
  } catch (error) {
    console.error("[BREVO ERROR]", error);
    return false;
  }
}