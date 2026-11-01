export function eventPriceLabel(
  priceType: string | null | undefined,
  registrationEnabled: boolean,
  price: number | null | undefined,
  currency: string | null | undefined,
) {
  if (priceType === "paid" && price != null) {
    return `${currency || "NGN"} ${Number(price).toLocaleString("en-NG")}`;
  }
  if (priceType === "free" && registrationEnabled) return "Free";
  return null;
}
