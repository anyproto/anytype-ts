import React, { forwardRef, useRef } from 'react';

import FooterAuthIndex from './auth';
import FooterAuthDisclaimer from './auth/disclaimer';
import FooterAuthOnboardEmail from './auth/email';
import FooterMainObject from './main/object';
import * as I from 'Interface';

interface Props extends I.FooterComponent {
	component: string;
	className?: string;
};

const Components = {
	authIndex:			 FooterAuthIndex,
	authDisclaimer:		 FooterAuthDisclaimer,
	authOnboardEmail:	 FooterAuthOnboardEmail,
	mainObject:			 FooterMainObject,
};

const Footer = forwardRef<{}, Props>((props, ref) => {
	
	const childRef = useRef(null);
	const { component, className = '' } = props;
	const Component = Components[component] || null;
	const cn = [ 'footer', component, className ];

	return (
		<div id="footer" className={cn.join(' ')}>
			{Component ? (
				<Component 
					ref={childRef} 
					{...props} 
				/>
			) : ''}
		</div>
	);

});

export default Footer;
