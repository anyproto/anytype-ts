import React, { forwardRef, useRef } from 'react';
import { I, S } from 'Lib';

import FooterAuthIndex from './auth';
import FooterAuthDisclaimer from './auth/disclaimer';
import FooterMainObject from './main/object';

interface Props extends I.FooterComponent {
	component: string;
	className?: string;
};

const Components = {
	authIndex:			 FooterAuthIndex,
	authDisclaimer:		 FooterAuthDisclaimer,
	mainObject:			 FooterMainObject,
};

const Footer = forwardRef<{}, Props>((props, ref) => {
	
	const childRef = useRef(null);
	const { component, className = '' } = props;
	const Component = Components[component] || null;
	const cn = [ 'footer', component, className ];

	const onHelp = () => {
		S.Menu.open('help', {
			element: '#footer #button-help',
			classNameWrap: 'fixed',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
			offsetY: () => -($('#notifications').height() + 78),
		});
	};

	return (
		<div id="footer" className={cn.join(' ')}>
			{Component ? (
				<Component 
					ref={childRef} 
					{...props} 
					onHelp={onHelp}
				/>
			) : ''}
		</div>
	);

});

export default Footer;