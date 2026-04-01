#!/usr/bin/env bun
/**
 * Generates TSX icon components from SVG files.
 * Usage: bun scripts/generate-icon-components.ts <svg-dir> <output-dir> <registry-prefix>
 * Example: bun scripts/generate-icon-components.ts src/img/icon/menu/action src/ts/component/util/icons/menu/action menu/action
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

const [ svgDir, outputDir, registryPrefix ] = process.argv.slice(2);

if (!svgDir || !outputDir || !registryPrefix) {
	console.error('Usage: bun scripts/generate-icon-components.ts <svg-dir> <output-dir> <registry-prefix>');
	process.exit(1);
}

if (!existsSync(outputDir)) {
	mkdirSync(outputDir, { recursive: true });
}

const svgFiles = readdirSync(svgDir).filter(f => f.endsWith('.svg')).sort();
const components: { name: string; fileName: string; componentName: string }[] = [];

for (const file of svgFiles) {
	const name = basename(file, '.svg');
	const componentName = name.charAt(0).toUpperCase() + name.slice(1).replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
	const raw = readFileSync(join(svgDir, file), 'utf-8');

	// Extract viewBox and fill from root <svg>
	const viewBox = raw.match(/viewBox="([^"]*)"/)?.[1] || '0 0 20 20';
	const explicitFill = raw.match(/<svg[^>]*\sfill="([^"]*)"/)?.[1];
	// If SVG has no fill attribute, use currentColor (SVG default is black, but we want CSS control)
	const rootFill = explicitFill ?? 'currentColor';

	// Extract inner content (everything between <svg> and </svg>)
	let inner = raw
		.replace(/<\?xml[^>]*\?>\s*/g, '')
		.replace(/<!--[\s\S]*?-->\s*/g, '')
		.replace(/<svg[^>]*>\s*/g, '')
		.replace(/\s*<\/svg>\s*/g, '')
		.trim();

	// Convert SVG attributes to JSX (kebab-case to camelCase)
	inner = inner
		.replace(/fill-rule=/g, 'fillRule=')
		.replace(/clip-rule=/g, 'clipRule=')
		.replace(/clip-path=/g, 'clipPath=')
		.replace(/fill-opacity=/g, 'fillOpacity=')
		.replace(/stroke-width=/g, 'strokeWidth=')
		.replace(/stroke-linecap=/g, 'strokeLinecap=')
		.replace(/stroke-linejoin=/g, 'strokeLinejoin=')
		.replace(/stroke-dasharray=/g, 'strokeDasharray=')
		.replace(/stroke-dashoffset=/g, 'strokeDashoffset=')
		.replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
		.replace(/stroke-opacity=/g, 'strokeOpacity=')
		.replace(/stop-color=/g, 'stopColor=')
		.replace(/stop-opacity=/g, 'stopOpacity=')
		.replace(/font-family=/g, 'fontFamily=')
		.replace(/font-size=/g, 'fontSize=')
		.replace(/text-anchor=/g, 'textAnchor=')
		.replace(/xlink:href=/g, 'xlinkHref=')
		.replace(/xml:space=/g, 'xmlSpace=')
		.replace(/xmlns:xlink="[^"]*"/g, '')
		.replace(/pattern-content-units=/gi, 'patternContentUnits=')
		.replace(/gradient-units=/gi, 'gradientUnits=')
		.replace(/gradient-transform=/gi, 'gradientTransform=');

	// Convert style="css-string" to style={{ jsxObject }}
	inner = inner.replace(/style="([^"]*)"/g, (_match, css: string) => {
		const props = css.split(';').filter(Boolean).map(prop => {
			const [ key, val ] = prop.split(':').map(s => s.trim());
			if (!key || !val) return '';
			const jsxKey = key.replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
			return `${jsxKey}: '${val}'`;
		}).filter(Boolean);
		return `style={{ ${props.join(', ')} }}`;
	});

	// Indent inner content
	const indentedInner = inner
		.split('\n')
		.map(line => line.trim() ? `\t\t${line.trim()}` : '')
		.filter(Boolean)
		.join('\n');

	const tsx = `import React from 'react';

const ${componentName} = (props: React.SVGProps<SVGSVGElement>) => (
\t<svg viewBox="${viewBox}" fill="${rootFill}" xmlns="http://www.w3.org/2000/svg" {...props}>
${indentedInner}
\t</svg>
);

export default ${componentName};
`;

	const fileName = `${name}.tsx`;
	writeFileSync(join(outputDir, fileName), tsx);
	components.push({ name, fileName: `./${name}`, componentName });
}

// Generate index.ts
const imports = components.map(c => `import ${c.componentName} from '${c.fileName}';`).join('\n');
const registrations = components.map(c => `registerIcon('${registryPrefix}/${c.name}', ${c.componentName});`).join('\n');

const indexTs = `import { registerIcon } from '${registryPrefix.split('/').map(() => '..').join('/')}/registry';
${imports}

${registrations}
`;

writeFileSync(join(outputDir, 'index.ts'), indexTs);
console.log(`Generated ${components.length} components in ${outputDir}`);
