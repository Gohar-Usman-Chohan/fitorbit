const resolveApp = (reqOrApp) => {
  if (reqOrApp?.app?.locals) return reqOrApp.app;
  if (reqOrApp?.locals) return reqOrApp;
  return null;
};

/**
 * Push a real-time session end event so the client logs out immediately.
 */
const forceUserSessionEnd = (reqOrApp, userId, options = {}) => {
  const app = resolveApp(reqOrApp);
  const io = app?.locals?.io;
  const activeUsers = app?.locals?.activeUsers;

  if (!io || !userId) return;

  const message =
    options.message ||
    'Your account has been suspended. You have been signed out.';

  const payload = {
    code: options.code || 'account_inactive',
    message,
  };

  const socketId = activeUsers?.get(String(userId));
  if (socketId) {
    io.to(socketId).emit('account_suspended', payload);
    activeUsers.delete(String(userId));
  }
};

module.exports = {
  forceUserSessionEnd,
};
