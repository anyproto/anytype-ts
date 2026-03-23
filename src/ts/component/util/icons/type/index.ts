import React from 'react';
import { registerIcon } from '../registry';

const svgModules = import.meta.glob('../../../../../img/icon/type/default/*.svg', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

for (const [ path, raw ] of Object.entries(svgModules)) {
	const name = path.split('/').pop()?.replace('.svg', '') || '';

	if (!name) {
		continue;
	};

	const Component = (props: React.SVGProps<SVGSVGElement>) => {
		const svg = raw
			.replace(/_COLOR_VAR_/g, 'currentColor')
			.replace(/<\/?svg[^>]*>/g, '')
			.replace(/fill="[^"]*"/g, '')
			.replace(/stroke="[^"]*"/g, '');

		return React.createElement('svg', {
			viewBox: raw.match(/viewBox="([^"]*)"/)?.[1] || '0 0 512 512',
			fill: 'currentColor',
			xmlns: 'http://www.w3.org/2000/svg',
			dangerouslySetInnerHTML: { __html: svg },
			...props,
		});
	};

	Component.displayName = `TypeIcon_${name}`;
	registerIcon(`type/${name}`, Component);
};
