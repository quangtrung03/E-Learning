const { spawn } = require('child_process');
const readline = require('readline');

console.log('🚀 Starting E-Learning Development Environment...');
console.log('💡 Press "S" + Enter to stop all servers\n');

let backendProcess;
let frontendProcess;

// Setup readline for key input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to start backend
function startBackend() {
  console.log('🔧 Starting Backend Server...');
  backendProcess = spawn('npm', ['run', 'server'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    cwd: process.cwd()
  });
  
  backendProcess.stdout.on('data', (data) => {
    process.stdout.write(`[BACKEND] ${data}`);
  });
  
  backendProcess.stderr.on('data', (data) => {
    process.stderr.write(`[BACKEND] ${data}`);
  });
  
  backendProcess.on('close', (code) => {
    console.log(`[BACKEND] Server stopped with code ${code}`);
  });
}

// Function to start frontend
function startFrontend() {
  console.log('⚡ Starting Frontend Server...');
  frontendProcess = spawn('npm', ['run', 'dev', '--', '--open'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    cwd: '../frontend'
  });
  
  frontendProcess.stdout.on('data', (data) => {
    process.stdout.write(`[FRONTEND] ${data}`);
  });
  
  frontendProcess.stderr.on('data', (data) => {
    process.stderr.write(`[FRONTEND] ${data}`);
  });
  
  frontendProcess.on('close', (code) => {
    console.log(`[FRONTEND] Server stopped with code ${code}`);
  });
}

// Function to stop all servers
function stopAllServers() {
  console.log('\n🛑 Stopping all servers...');
  
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
  }
  
  if (frontendProcess) {
    frontendProcess.kill('SIGTERM');
  }
  
  // Force kill after 3 seconds if still running
  setTimeout(() => {
    if (backendProcess && !backendProcess.killed) {
      console.log('🔥 Force killing backend...');
      backendProcess.kill('SIGKILL');
    }
    if (frontendProcess && !frontendProcess.killed) {
      console.log('🔥 Force killing frontend...');
      frontendProcess.kill('SIGKILL');
    }
    
    console.log('✅ All servers stopped successfully!');
    rl.close();
    process.exit(0);
  }, 3000);
}

// Listen for keyboard input
rl.on('line', (input) => {
  const command = input.trim().toLowerCase();
  
  if (command === 's') {
    stopAllServers();
  } else if (command === 'r') {
    console.log('🔄 Restarting servers...');
    stopAllServers();
    setTimeout(() => {
      startBackend();
      setTimeout(() => startFrontend(), 2000);
    }, 1000);
  } else if (command === 'h' || command === 'help') {
    console.log('\n📚 Available commands:');
    console.log('  S - Stop all servers');
    console.log('  R - Restart all servers');
    console.log('  H - Show this help');
    console.log('');
  }
});

// Handle process termination
process.on('SIGINT', stopAllServers);
process.on('SIGTERM', stopAllServers);

// Start both servers
startBackend();
setTimeout(() => startFrontend(), 2000);

// Show available commands
setTimeout(() => {
  console.log('\n📚 Commands available:');
  console.log('  Type "S" + Enter - Stop servers');
  console.log('  Type "R" + Enter - Restart servers');
  console.log('  Type "H" + Enter - Show help');
  console.log('  Ctrl+C - Force exit\n');
}, 5000);
