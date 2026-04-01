import React, { forwardRef, useEffect, useRef } from 'react';
import { Icon, Label } from 'Component';

const PageMainSettingsMembershipLoader = forwardRef<HTMLDivElement, {}>((props, ref) => {

	const nodeRef = useRef<any>(null);
	const timeoutRef = useRef<any>(null);

	useEffect(() => {
		timeoutRef.current = window.setTimeout(() => {
			U.Dom.addClass(nodeRef.current, 'longWait');
		}, 5000);

		return () => {
			window.clearTimeout(timeoutRef.current);
		};
	}, []);

	return (
		<div ref={nodeRef} className="loaderWrapper">
			<div className="inner">
				<Icon />
				<Label text={translate('popupSettingsMembershipLoaderText1')} />
				<Label className="wait" text={translate('popupSettingsMembershipLoaderText2')} />
			</div>
		</div>
	);

});

export default PageMainSettingsMembershipLoader;
