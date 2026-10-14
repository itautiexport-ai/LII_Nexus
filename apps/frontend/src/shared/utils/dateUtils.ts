/**
 * Utility to format dates and timestamps into Indian Standard Time (IST, UTC+05:30)
 * in 12-hour AM/PM format: DD/MM/YYYY, hh:mm:ss am/pm
 */

export function formatIndianDateTime(val: string | Date | null | undefined): string {
  if (!val) return "-";
  let d: Date;
  if (typeof val === "string") {
    let s = val.trim();
    if (!s) return "-";
    // If string has no timezone offset (+ or Z), treat it as IST representation from MySQL
    if (!s.includes("Z") && !s.includes("+") && !s.includes("-", 10)) {
      s = (s.includes("T") ? s : s.replace(" ", "T")) + "+05:30";
    }
    d = new Date(s);
  } else {
    d = val;
  }

  if (isNaN(d.getTime())) return String(val);

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
  if (!val) return "-";
  let d: Date;
  if (typeof val === "string") {
    let s = val.trim();
    if (!s) return "-";
    if (!s.includes("Z") && !s.includes("+") && !s.includes("-", 10)) {
      s = (s.includes("T") ? s : s.replace(" ", "T")) + "+05:30";
    }
    d = new Date(s);
  } else {
    d = val;
  }

  if (isNaN(d.getTime())) return String(val);

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function getIndianCurrentDateTime(): string {
  return formatIndianDateTime(new Date());
}

export function getIndianDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}
