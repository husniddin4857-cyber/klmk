const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting F-Mobile Combined Server...');

// Start Backend
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'f-mobile-backend'),
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.BACKEND_PORT || 5002 }
});

backend.on('error', (err) => {
  console.error('❌ Backend error:', err);
  process.exit(1);
});

backend.on('exit', (code) => {
  console.log(`Backend exited with code ${code}`);
  process.exit(code);
});

// Start Frontend
const frontend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'f-mobile'),
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || 3000 },
  shell: true
});

frontend.on('error', (err) => {
  console.error('❌ Frontend error:', err);
  backend.kill();
  process.exit(1);
});

frontend.on('exit', (code) => {
  console.log(`Frontend exited with code ${code}`);
  backend.kill();
  process.exit(code);
});

// Handle termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  backend.kill();
  frontend.kill();
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  backend.kill();
  frontend.kill();
});

console.log('✅ Both servers started successfully!');
console.log('📡 Backend: http://localhost:' + (process.env.BACKEND_PORT || 5002));
console.log('🌐 Frontend: http://localhost:' + (process.env.PORT || 3000));
