export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseDate(dateStr) {
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr !== 'string') return new Date(dateStr);

  // SQLite CURRENT_TIMESTAMP returns UTC datetime without a timezone offset,
  // e.g. "2026-05-30 20:00:00". Treat that as UTC so the browser can convert it
  // to the user's local time.
  const sqliteUtcDatetime = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (sqliteUtcDatetime.test(dateStr)) {
    return new Date(dateStr.replace(' ', 'T') + 'Z');
  }

  return new Date(dateStr);
}

export function formatDate(dateStr) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(parseDate(dateStr));
}
