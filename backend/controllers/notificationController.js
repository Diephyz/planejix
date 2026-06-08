const { getUpcomingReminders } = require('../services/reminderService');

exports.getUpcoming = (req, res) => {
  const { userId } = req.user;

  const rows = getUpcomingReminders({ userId, daysBefore: 3 });

  const notifications = rows.map((r) => ({
    id: r.id,
    description: r.description,
    amount: r.amount,
    date: r.date,
    type: r.reminder_type, // 'due_today' | 'due_in_3_days'
  }));

  res.json(notifications);
};
