export function formatPhoneForApi(digits: string) {
  if (!digits) return "";
  if (digits.startsWith("0")) return digits;
  return `0${digits}`;
}

export function phoneToDigits(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function isCompletePhone(digits: string) {
  return digits.length >= 10;
}

export function formatPhoneForDisplay(phone: string) {
  const digits = phoneToDigits(phone);
  if (!digits) return phone || "—";
  if (digits.length === 10) {
    return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone.startsWith("+") ? phone : `0${digits}`;
}

export function phoneToTelUri(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("92")) return `tel:+${digits}`;
  if (digits.startsWith("0")) return `tel:+92${digits.slice(1)}`;
  return `tel:+92${digits}`;
}
