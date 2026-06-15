const CNIC_DIGIT_LIMIT = 13;
const CNIC_FORMATTED_LENGTH = 15;

export function getCnicDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, CNIC_DIGIT_LIMIT);
}

/** Formats CNIC as XXXXX-XXXXXXX-X while typing. */
export function formatCnic(value: string) {
  const digits = getCnicDigits(value);

  if (digits.length <= 5) {
    return digits;
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function isCompleteCnic(value: string) {
  return getCnicDigits(value).length === CNIC_DIGIT_LIMIT;
}

export function isEmptyOrCompleteCnic(value: string) {
  const digits = getCnicDigits(value);
  return digits.length === 0 || digits.length === CNIC_DIGIT_LIMIT;
}

export { CNIC_DIGIT_LIMIT, CNIC_FORMATTED_LENGTH };
