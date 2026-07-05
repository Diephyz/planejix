const jwt = require('jsonwebtoken');
const db = require('../database/db');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT is_admin, expires_at, plan, token_version FROM users WHERE id = ?').get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Sessões antigas são invalidadas quando token_version muda (ex: troca de senha)
    if ((decoded.tv ?? 0) !== (user.token_version ?? 0)) {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }

    if (!user.is_admin && user.expires_at && new Date(user.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Conta expirada. Entre em contato com o administrador.' });
    }

    req.user = { userId: decoded.userId, username: decoded.username, isAdmin: !!user.is_admin, plan: user.plan || 'free' };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Acesso restrito ao administrador' });
  }
  next();
}

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
