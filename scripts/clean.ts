#!/usr/bin/env bun
/**
 * Bun-optimized clean script
 * 
 * Cleans build artifacts and caches for fresh builds
 * 
 * Usage:
 *   bun run scripts/clean.ts [options]
 * 
 * Options:
 *   --all     Clean everything including node_modules
 *   --dist    Clean dist folder only (default)
 *   --cache   Clean Bun cache
 */

import { $ } from 'bun';
import { parseArgs } from 'util';

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    all: { type: 'boolean', default: false },
    dist: { type: 'boolean', default: false },
    cache: { type: 'boolean', default: false },
  },
  strict: true,
  allowPositionals: true,
});

const cleanAll = values.all;
const cleanDist = values.dist || (!values.all && !values.cache);
const cleanCache = values.cache;

console.log('🧹 Cleaning...\n');

async function clean() {
  const startTime = performance.now();

  if (cleanDist || cleanAll) {
    console.log('📁 Cleaning dist folder...');
    await $`rm -rf dist/*`;
    console.log('✅ Dist folder cleaned\n');
  }

  if (cleanCache || cleanAll) {
    console.log('💾 Cleaning Bun cache...');
    await $`bun pm cache rm`;
    console.log('✅ Bun cache cleaned\n');
  }

  if (cleanAll) {
    console.log('📦 Removing node_modules...');
    await $`rm -rf node_modules`;
    console.log('✅ node_modules removed\n');
    console.log('💡 Run "bun install" to reinstall dependencies');
  }

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`✨ Clean completed in ${duration}s`);
}

await clean();
