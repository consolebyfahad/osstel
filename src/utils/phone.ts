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
