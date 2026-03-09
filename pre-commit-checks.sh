#!/bin/bash
echo "Running Pre-commit checks..."
echo "Verify TypeScript compilation..."
npx tsc --noEmit -p tsconfig.json
echo "Running Tests..."
npx jest src/ts/lib/import/notion/*.test.ts
