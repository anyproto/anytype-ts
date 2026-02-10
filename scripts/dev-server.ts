#!/usr/bin/env bun
/**
 * Bun-optimized development server
 * 
 * This script provides a faster alternative to the npm-run-all setup
 * by leveraging Bun's parallel execution capabilities.
 * 
 * Usage:
 *   bun run scripts/dev-server.ts
 */

import { $, spawn } from 'bun';

const SERVER_PORT = process.env.SERVER_PORT || 8080;
const DATA_PATH = process.env.DATA_PATH || '';

console.log(`🚀 Starting Bun dev server...`);
console.log(`   Port: ${SERVER_PORT}`);
console.log(`   Data Path: ${DATA_PATH || '(default)'}`);

let rspackProcess: ReturnType<typeof spawn> | null = null;
let electronProcess: ReturnType<typeof spawn> | null = null;

async function startRspackDevServer() {
  console.log('\n📦 Starting Rspack dev server...');
  
  rspackProcess = spawn({
    cmd: ['rspack', 'serve', '--mode=development', '--node-env=development', 
          '--env', `SERVER_PORT=${SERVER_PORT}`, 
          '--env', `DATA_PATH=${DATA_PATH}`],
    stdout: 'inherit',
    stderr: 'inherit',
    onExit: (code) => {
      console.log(`Rspack dev server exited with code ${code}`);
      cleanup();
    },
  });
}

async function startElectron() {
  console.log('\n⚡ Waiting for Rspack server to be ready...');
  
  // Wait for localhost to be available
  let retries = 0;
  const maxRetries = 60;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(`http://localhost:${SERVER_PORT}`);
      if (response.ok) {
        console.log('✅ Rspack server is ready!');
        break;
      }
    } catch {
      // Server not ready yet
    }
    
    retries++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (retries >= maxRetries) {
    console.error('❌ Timeout waiting for Rspack server');
    cleanup();
    return;
  }
  
  console.log('\n🔌 Starting Electron...');
  
  electronProcess = spawn({
    cmd: ['electron', '.'],
    stdout: 'inherit',
    stderr: 'inherit',
    onExit: (code) => {
      console.log(`Electron exited with code ${code}`);
      cleanup();
    },
  });
}

function cleanup() {
  console.log('\n🧹 Cleaning up...');
  
  if (rspackProcess) {
    rspackProcess.kill();
    rspackProcess = null;
  }
  
  if (electronProcess) {
    electronProcess.kill();
    electronProcess = null;
  }
  
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start both processes
await Promise.all([
  startRspackDevServer(),
  startElectron(),
]);
