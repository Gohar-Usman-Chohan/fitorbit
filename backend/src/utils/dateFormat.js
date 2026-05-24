function toDate(value) {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. June 25, 2026 */
function formatDate(value, fallback = '') {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** e.g. 2:30 PM */
function formatTime(value, fallback = '') {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** e.g. June 25, 2026 at 2:30 PM */
function formatDateTime(value, fallback = '') {
  const date = toDate(value);
  if (!date) return fallback;
  return `${formatDate(date)} at ${formatTime(date)}`;
}

module.exports = {
  formatDate,
  formatTime,
  formatDateTime,
};
