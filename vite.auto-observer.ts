import type { Plugin } from 'vite';

/**
 * Vite plugin that automatically wraps React component default exports with MobX `observer()`.
 *
 * Handles:
 *   export default ComponentName;          → export default observer(ComponentName);
 *   export default memo(ComponentName);    → export default memo(observer(ComponentName));
 *
 * Only processes .tsx files under src/ts/component/ (or extension/ for the extension build).
 * Skips class components (observer() only works with function components).
 * Skips files without a matching default export.
 */
export function autoObserverPlugin(): Plugin {
	return {
		name: 'auto-observer',
		enforce: 'pre',

		transform(code, id) {
			if (!id.endsWith('.tsx')) return null;
			if (!id.includes('/src/ts/component/') && !id.includes('/extension/')) return null;

			// Skip class components — observer() only works with function components
			if (/\bclass\s+\w+\s+extends\s+(React\.)?(Component|PureComponent)\b/.test(code)) {
				return null;
			}

			// Pattern A: export default <Component>;
			const plainExport = code.match(/^(export\s+default\s+)([A-Z]\w+)(\s*;)/m);
			if (plainExport) {
				const result = code.replace(
					/^(export\s+default\s+)([A-Z]\w+)(\s*;)/m,
					'$1observer($2)$3',
				);
				return ensureImport(result);
			}

			// Pattern B: export default memo(<Component>);
			const memoExport = code.match(/^(export\s+default\s+memo\s*\(\s*)([A-Z]\w+)(\s*\)\s*;)/m);
			if (memoExport) {
				const result = code.replace(
					/^(export\s+default\s+memo\s*\(\s*)([A-Z]\w+)(\s*\)\s*;)/m,
					'$1observer($2)$3',
				);
				return ensureImport(result);
			}

			return null;
		},
	};
}

function ensureImport(code: string): string {
	if (code.includes("from 'mobx-react-lite'")) return code;
	return `import { observer } from 'mobx-react-lite';\n` + code;
}
