// Health check endpoint for Render.com
module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'f-mobile-backend',
    uptime: process.uptime()
  });
};
