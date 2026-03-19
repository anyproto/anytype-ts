import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function ScanIcon({ size, color: _color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 512 512"><path d="M342,444h46a56,56,0,0,0,56-56V342"/><path d="M444,170V124a56,56,0,0,0-56-56H342"/><path d="M170,444H124a56,56,0,0,1-56-56V342"/><path d="M68,170V124a56,56,0,0,1,56-56h46"/></svg>
	);
}
