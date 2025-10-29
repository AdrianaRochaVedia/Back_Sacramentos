module.exports = function errorHandler() {
  return (err, req, res, next) => {
    try { res.locals._hasException = true; } catch (_) {}
    const status = Number(err?.status || err?.statusCode || 500);
    const msg = err?.message || 'Error interno';
    console.error('Unhandled error:', err?.stack || err);
    res.status(status).json({ ok: false, msg });
  };
};
