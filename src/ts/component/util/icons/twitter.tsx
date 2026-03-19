import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function TwitterIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M14.7719 2.5H17.3165L11.7573 8.85385L18.2973 17.5H13.1765L9.16578 12.2562L4.57654 17.5H2.03039L7.97654 10.7038L1.7027 2.5H6.95347L10.5789 7.29308L14.7719 2.5ZM13.8789 15.9769H15.2889L6.18731 3.94308H4.67424L13.8789 15.9769Z" fill={color}/>
</svg>
	);
}
