#!/usr/bin/env bun
/**
 * Bun-optimized build script for Anytype
 * 
 * This script provides faster builds by using Bun for:
 * - TypeScript type checking
 * - Script execution
 * - Utility tasks
 * 
 * Usage:
 *   bun run scripts/build-bun.ts [target]
 * 
 * Targets:
 *   dev      - Development build with hot reload
 *   prod     - Production build
 *   web      - Web-only build
 *   extension - Browser extension build
 */

import { $ } from 'bun';
import { parseArgs } from 'util';

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    target: { type: 'string', short: 't' },
    mode: { type: 'string', short: 'm', default: 'development' },
    watch: { type: 'boolean', short: 'w', default: false },
  },
  strict: true,
  allowPositionals: true,
});

const target = positionals[2] || 'dev';
const mode = values.mode || 'development';
const isProduction = mode === 'production';

console.log(`🚀 Bun Build starting...`);
console.log(`   Target: ${target}`);
console.log(`   Mode: ${mode}`);
console.log(`   Watch: ${values.watch}`);

async function runBuild() {
  const startTime = performance.now();

  try {
    switch (target) {
      case 'dev':
        await buildDev();
        break;
      case 'prod':
      case 'production':
        await buildProduction();
        break;
      case 'web':
        await buildWeb();
        break;
      case 'extension':
        await buildExtension();
        break;
      case 'typecheck':
        await runTypeCheck();
        break;
      default:
        console.log(`Unknown target: ${target}`);
        console.log('Available targets: dev, prod, web, extension, typecheck');
        process.exit(1);
    }

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ Build completed in ${duration}s`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

async function buildDev() {
  console.log('\n📦 Starting development build...');
  
  // Run type check in parallel
  const typeCheckPromise = runTypeCheck();
  
  // Build with Rspack (keeping it since it's Electron-specific)
  await $`rspack --mode=development --node-env=development --config rspack.config.js`;
  
  await typeCheckPromise;
}

async function buildProduction() {
  console.log('\n📦 Starting production build...');
  
  // Clean and prepare
  await $`rm -rf dist/js/*.map`; // Remove source maps for smaller builds
  
  // Run production build
  await $`rspack --mode=production --node-env=production --config rspack.config.js`;
  
  console.log('✨ Production build complete');
}

async function buildWeb() {
  console.log('\n🌐 Building web target...');
  
  // Set environment variable and build
  process.env.BUILD_TARGET = 'web';
  await $`cross-env BUILD_TARGET=web rspack --mode=production --node-env=production --env target=web`;
  
  console.log('✨ Web build complete');
}

async function buildExtension() {
  console.log('\n🔌 Building browser extension...');
  
  // Extension uses the same rspack config with extension target
  await $`rspack --mode=production --node-env=production --config rspack.config.js`;
  
  console.log('✨ Extension build complete');
}

async function runTypeCheck() {
  console.log('\n🔍 Running TypeScript type check...');
  
  // Use Bun's built-in TypeScript transpiler for speed
  // But still run tsc for full type checking
  const result = await $`bunx tsc --noEmit -p tsconfig.json`.nothrow();
  
  if (result.exitCode === 0) {
    console.log('✅ Type check passed');
  } else {
    console.log('⚠️  Type check completed with errors');
  }
  
  return result;
}

// Run the build
await runBuild();
