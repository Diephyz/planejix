function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>]/g, '').trim();
}

function sanitizeObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      clean[key] = sanitize(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

function validateTransaction(req, res, next) {
  const { type, description, amount, date } = req.body;

  if (!type || !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Tipo deve ser income ou expense' });
  }
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({ error: 'Descrição é obrigatória' });
  }
  if (description.length > 500) {
    return res.status(400).json({ error: 'Descrição muito longa (máx 500 caracteres)' });
  }
  if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 999999999) {
    return res.status(400).json({ error: 'Valor deve ser um número positivo' });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Data inválida (formato YYYY-MM-DD)' });
  }

  if (req.body.kind && !['fixed', 'variable', 'custom'].includes(req.body.kind)) {
    return res.status(400).json({ error: 'Subtipo inválido' });
  }
  if (req.body.notes && req.body.notes.length > 1000) {
    return res.status(400).json({ error: 'Observações muito longas (máx 1000 caracteres)' });
  }

  req.body = sanitizeObj(req.body);
  next();
}

function validateCategory(req, res, next) {
  const { name, color } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  if (name.length > 100) {
    return res.status(400).json({ error: 'Nome muito longo (máx 100 caracteres)' });
  }
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return res.status(400).json({ error: 'Cor inválida (formato #RRGGBB)' });
  }

  req.body = sanitizeObj(req.body);
  next();
}

function validateBudget(req, res, next) {
  const { amount, period } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 999999999) {
    return res.status(400).json({ error: 'Valor deve ser um número positivo' });
  }
  if (period && !['monthly', 'annual'].includes(period)) {
    return res.status(400).json({ error: 'Período deve ser monthly ou annual' });
  }

  req.body = sanitizeObj(req.body);
  next();
}

function validateAuth(req, res, next) {
  req.body = sanitizeObj(req.body);
  next();
}

module.exports = { sanitize, sanitizeObj, validateTransaction, validateCategory, validateBudget, validateAuth };
