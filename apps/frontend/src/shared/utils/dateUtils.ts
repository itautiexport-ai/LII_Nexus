/**
 * Utility to format dates and timestamps into Indian Standard Time (IST, UTC+05:30)
 * in 12-hour AM/PM format: DD/MM/YYYY, hh:mm:ss am/pm
 */

export function parseUtcDateTime(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  let d: Date;
  if (typeof val === "string") {
    let s = val.trim();
    if (!s) return null;
    // If string has no timezone offset (+ or Z), treat it as UTC from MySQL
    if (!s.includes("Z") && !s.includes("+") && !s.includes("-", 10)) {
      s = (s.includes("T") ? s : s.replace(" ", "T")) + "Z";
    }
    d = new Date(s);
  } else {
    d = val;
  }

  return isNaN(d.getTime()) ? null : d;
}

export function formatIndianDateTime(val: string | Date | null | undefined): string {
  const d = parseUtcDateTime(val);
  if (!d) return val ? String(val) : "-";

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatIndianTime(val: string | Date | null | undefined): string {
  const d = parseUtcDateTime(val);
  if (!d) return val ? String(val) : "-";

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatIndianDate(val: string | Date | null | undefined): string {
  const d = parseUtcDateTime(val);
  if (!d) return val ? String(val) : "-";

  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatIndianShortTime(val: string | Date | null | undefined): string {
  const d = parseUtcDateTime(val);
  if (!d) return val ? String(val) : "-";

  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatIndianShortDateTime(val: string | Date | null | undefined): string {
  const d = parseUtcDateTime(val);
  if (!d) return val ? String(val) : "-";

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatIndianDateTimeLocalValue(val: string | Date | null | undefined): string {
  const d = parseUtcDateTime(val);
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function indianDateTimeLocalToUtcIso(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) throw new Error("Invalid Indian date/time");
  const [, year, month, day, hour, minute, second = "00"] = match;
  const utcMillis = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ) - 330 * 60 * 1000;
  return new Date(utcMillis).toISOString();
}

export function getIndianCurrentDateTime(): string {
  return formatIndianDateTime(new Date());
}

export function getIndianDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}
