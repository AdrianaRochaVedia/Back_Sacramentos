const { randomUUID } = require('crypto');

module.exports = function correlation() {
  return (req, res, next) => {
    const header = 'x-correlation-id';
    const provided = req.headers[header];
    const cid = (typeof provided === 'string' && provided.trim()) ? provided.trim() : randomUUID();
    req.correlationId = String(cid);
    res.setHeader(header, req.correlationId);
    next();
  };
};
