import React from 'react';
import type { IconSvgProps } from '../../iconRegistry';

export function CommentMenuNumberedIcon({ size, color }: IconSvgProps) {
	return (
		<svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20" fill="none">
			<g clipPath="url(#clip0_0_65)">
				<path d="M12.9545 15.0796C12.7092 15.0796 12.4987 14.9917 12.3231 14.8161C12.1474 14.6404 12.0596 14.4299 12.0596 14.1847C12.0596 13.9394 12.1474 13.729 12.3231 13.5533C12.4987 13.3776 12.7092 13.2898 12.9545 13.2898C13.1997 13.2898 13.4102 13.3776 13.5858 13.5533C13.7615 13.729 13.8493 13.9394 13.8493 14.1847C13.8493 14.3471 13.8079 14.4962 13.7251 14.6321C13.6455 14.768 13.5378 14.8774 13.4019 14.9602C13.2693 15.0398 13.1202 15.0796 12.9545 15.0796Z" fill={color}/>
				<path d="M9.75302 4.81824V15.0001H8.52006V6.11085H8.4604L5.97461 7.76142V6.50858L8.52006 4.81824H9.75302Z" fill={color}/>
			</g>
			<defs>
				<clipPath id="clip0_0_65">
					<rect width="20" height="20" fill={color}/>
				</clipPath>
			</defs>
		</svg>
	);
}
