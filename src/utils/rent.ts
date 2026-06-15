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
