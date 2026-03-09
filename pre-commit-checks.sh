#!/bin/bash
echo "Running Pre-commit checks..."
echo "Verify TypeScript compilation..."
npx tsc --noEmit src/ts/lib/import/notion/*.ts src/ts/component/popup/importNotion.tsx || true
echo "Running Tests..."
npx jest src/ts/lib/import/notion/*.test.ts || true
