export function isRentDueWindow(day = new Date().getDate()) {
  return day <= 5;
}

export function rentDueDateLabel(month: number, year: number) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${monthNames[month - 1] ?? "Month"} 5, ${year}`;
}

export function getTenancyRentMonthBounds(
  checkInDate: string | Date | null | undefined,
  targetYear: number,
  now = new Date(),
) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (targetYear > currentYear) {
    return { startMonth: null, endMonth: null };
  }

  const checkIn = checkInDate ? new Date(checkInDate) : null;
  if (!checkIn || Number.isNaN(checkIn.getTime())) {
    const endMonth = targetYear < currentYear ? 12 : currentMonth;
    return { startMonth: 1, endMonth };
  }

  const checkInYear = checkIn.getFullYear();
  const checkInMonth = checkIn.getMonth() + 1;

  if (targetYear < checkInYear) {
    return { startMonth: null, endMonth: null };
  }

  const startMonth = targetYear > checkInYear ? 1 : checkInMonth;
  const endMonth = targetYear < currentYear ? 12 : currentMonth;

  if (startMonth > endMonth) {
    return { startMonth: null, endMonth: null };
  }

  return { startMonth, endMonth };
}

export function getEligibleRentMonths(
  checkInDate: string | Date | null | undefined,
  targetYear: number,
  now = new Date(),
) {
  const { startMonth, endMonth } = getTenancyRentMonthBounds(
    checkInDate,
    targetYear,
    now,
  );
  if (startMonth == null || endMonth == null) return [];

  const months: number[] = [];
  for (let month = startMonth; month <= endMonth; month += 1) {
    months.push(month);
  }
  return months;
}

export function getRentHistoryStartYear(
  checkInDate: string | Date | null | undefined,
) {
  if (!checkInDate) return new Date().getFullYear();
  const checkIn = new Date(checkInDate);
  if (Number.isNaN(checkIn.getTime())) return new Date().getFullYear();
  return checkIn.getFullYear();
}
