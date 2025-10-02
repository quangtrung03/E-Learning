const { spawn } = require('child_process');
const open = require('open-cli');

console.log('🚀 Starting E-Learning Development Environment...\n');

// Start backend
console.log('🔧 Starting Backend Server...');
const backend = spawn('npm', ['run', 'server'], { 
  stdio: 'inherit',
  shell: true 
});

// Start frontend after 2 seconds
setTimeout(() => {
  console.log('⚡ Starting Frontend Development Server...');
  const frontend = spawn('npm', ['run', 'frontend'], { 
    stdio: 'inherit',
    shell: true 
  });
  
  // Open browser after 5 seconds
  setTimeout(() => {
    console.log('🌐 Opening browser...');
    open('http://localhost:5173');
    
    setTimeout(() => {
      console.log('📚 Swagger API Docs available at: http://localhost:5000/api-docs');
    }, 2000);
  }, 5000);
  
}, 2000);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  backend.kill();
  process.exit();
});