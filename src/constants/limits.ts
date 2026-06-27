/** Keep in sync with osstel-backend `src/config/limits.js`. */
export const LIMITS = {
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 72,
  NAME_MAX: 80,
  HOSTEL_NAME_MAX: 100,
  ADDRESS_MAX: 200,
  ROOM_NUMBER_MAX: 20,
  RENT_MAX: 9_999_999,
  PHONE_DIGITS_MAX: 10,
  USER_ID_MAX: 20,
  NOTE_MAX: 300,
  SUBJECT_MAX: 120,
  MESSAGE_MAX: 2000,
  COMPLAINT_TITLE_MAX: 100,
  COMPLAINT_DESCRIPTION_MAX: 1000,
  EXPENSE_DETAILS_MAX: 500,
  PROFILE_NAME_MAX: 60,
  CNIC_FORMATTED_LENGTH: 15,
} as const;

export function isPasswordLengthValid(password: string) {
  return (
    password.length >= LIMITS.PASSWORD_MIN &&
    password.length <= LIMITS.PASSWORD_MAX
  );
}

export function passwordLengthHint() {
  return `${LIMITS.PASSWORD_MIN}-${LIMITS.PASSWORD_MAX} characters`;
}
