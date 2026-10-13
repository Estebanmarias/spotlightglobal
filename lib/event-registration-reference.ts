export function formatEventRegistrationReference(registrationId: string) {
  const normalizedId = registrationId.replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/i.test(normalizedId)) {
    throw new Error("Invalid event registration ID");
  }

  return `TS-${BigInt(`0x${normalizedId}`).toString(36).toUpperCase().padStart(25, "0")}`;
}