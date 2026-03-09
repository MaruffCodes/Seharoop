/**
 * Script to run the document worker independently
 * Usage: node scripts/runWorker.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting document processing worker...');

// Spawn the worker as a child process
const worker = spawn('node', [path.join(__dirname, '../workers/documentWorker.js')], {
    stdio: 'inherit',
    env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development'
    }
});

worker.on('error', (error) => {
    console.error('❌ Worker process error:', error);
});

worker.on('exit', (code, signal) => {
    if (code !== 0) {
        console.error(`❌ Worker process exited with code ${code} and signal ${signal}`);
    } else {
        console.log('✅ Worker process exited normally');
    }
});

// Handle parent process termination
process.on('SIGINT', () => {
    console.log('\n📥 Received SIGINT, killing worker...');
    worker.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n📥 Received SIGTERM, killing worker...');
    worker.kill('SIGTERM');
});

console.log('✅ Worker process spawned with PID:', worker.pid);
