const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad = (value: number) => value.toString().padStart(2, "0");

export const formatDate = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export const formatTime = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const isWeekend = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const isAfterHours = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  const hour = date.getHours();
  return hour < 6 || hour >= 19;
};
