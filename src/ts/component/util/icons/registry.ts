import { FC, SVGProps } from 'react';

type SvgIconComponent = FC<SVGProps<SVGSVGElement>>;

const registry = new Map<string, SvgIconComponent>();

export const registerIcon = (name: string, component: SvgIconComponent) => {
	registry.set(name, component);
};

export const getIcon = (name: string): SvgIconComponent | undefined => {
	return registry.get(name);
};

export const getAllIcons = (): Map<string, SvgIconComponent> => {
	return registry;
};

export const getIconsByFolder = (): Map<string, string[]> => {
	const folders = new Map<string, string[]>();

	for (const name of registry.keys()) {
		const parts = name.split('/');
		const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';

		if (!folders.has(folder)) {
			folders.set(folder, []);
		};

		folders.get(folder)!.push(name);
	};

	return folders;
};
