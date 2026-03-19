import React from 'react';
import type { IconSvgProps } from '../iconRegistry';

export function MenuStyleNumberedIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
<path d="M2.0586 17H5.01954V16.2312H3.39844V16.2062L3.87696 15.7707C4.74415 15.025 4.97071 14.6455 4.97071 14.1927C4.97071 13.4817 4.38282 13 3.47461 13C2.58985 13 1.99805 13.5029 2 14.3064H2.91602C2.91602 13.9499 3.13868 13.7437 3.47071 13.7437C3.79688 13.7437 4.03321 13.9422 4.03321 14.2678C4.03321 14.5626 3.84571 14.763 3.51758 15.0539L2.0586 16.3141V17Z" fill={color}/>
<rect x="7" y="9.25" width="8" height="1.5" fill={color}/>
<rect x="7" y="4.25" width="11" height="1.5" fill={color}/>
<rect x="7" y="14.25" width="11" height="1.5" fill={color}/>
<path d="M4 3H3.10352L2.11719 3.61328V4.44922L3.01172 3.90234H3.03516V7H4V3Z" fill={color}/>
</svg>
	);
}
