const db = require('../database/db');

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns expense transactions that are due today or in `daysBefore` days.
 * Each item gets an extra `reminder_type` field: 'due_today' | 'due_in_3_days'.
 *
 * @param {Object} opts
 * @param {number} [opts.userId] - if provided, restricts results to this user
 * @param {number} [opts.daysBefore=3] - how many days ahead counts as "upcoming"
 * @returns {Array} transactions joined with user email/name + reminder_type
 */
function getUpcomingReminders({ userId, daysBefore = 3 } = {}) {
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + daysBefore);

  const todayStr = formatDate(today);
  const futureStr = formatDate(future);

  const query = `
    SELECT t.id, t.user_id, t.description, t.amount, t.date,
           t.reminder_3d_sent_at, t.reminder_due_sent_at,
           u.email, u.name, u.username,
           CASE WHEN t.date = ? THEN 'due_today' ELSE 'due_in_3_days' END AS reminder_type
    FROM transactions t
    JOIN users u ON u.id = t.user_id
    WHERE t.type = 'expense'
      AND t.date IN (?, ?)
      ${userId ? 'AND t.user_id = ?' : ''}
    ORDER BY t.date ASC
  `;

  const params = userId
    ? [todayStr, todayStr, futureStr, userId]
    : [todayStr, todayStr, futureStr];

  return db.prepare(query).all(...params);
}

module.exports = { getUpcomingReminders };
