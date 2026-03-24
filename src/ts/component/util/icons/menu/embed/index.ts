import React from 'react';
import { registerIcon } from '../../registry';

const svgModules = import.meta.glob('/src/img/icon/menu/embed/*.svg', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

for (const [ path, raw ] of Object.entries(svgModules)) {
	const name = path.split('/').pop()?.replace('.svg', '') || '';

	if (!name) {
		continue;
	};

	const viewBox = raw.match(/viewBox="([^"]*)"/)?.[1] || '0 0 20 20';
	const inner = raw.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

	const Component = (props: React.SVGProps<SVGSVGElement>) => React.createElement('svg', {
		viewBox,
		fill: 'none',
		xmlns: 'http://www.w3.org/2000/svg',
		dangerouslySetInnerHTML: { __html: inner },
		...props,
	});

	Component.displayName = `MenuEmbedIcon_${name}`;
	registerIcon(`menu/embed/${name}`, Component);
};
