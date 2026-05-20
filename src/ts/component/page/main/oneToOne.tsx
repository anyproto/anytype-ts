import React, { forwardRef, useRef, useEffect, useImperativeHandle, useState } from 'react';
import { Loader, Error, Frame, Button, Footer } from 'Component';
import * as I from 'Interface';

const PageMainOneToOne = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const [ error, setError ] = useState('');
	const param = keyboard.getMatch(isPopup).params;
	const nodeRef = useRef(null);
	const frameRef = useRef(null);

	const init = () => {
		U.Space.openOneToOne(param.id, param.key, analytics.route.link);
	};

	const resize = () => {
		const obj = U.Dom.getPageFlexContainer(isPopup);
		const oh = obj?.clientHeight || 0;
		const wh = isPopup ? oh : window.innerHeight;

		if (nodeRef.current) {
			U.Dom.css(nodeRef.current, { height: `${wh}px` });
		};
		frameRef.current?.resize();
	};

	useEffect(() => {
		init();
	}, []);

	useImperativeHandle(ref, () => ({ resize }));

	return (
		<div 
			ref={nodeRef}
			className="wrapper"
		>
			<Frame ref={frameRef}>
				<Error text={error} />

				{error ? (
					<div className="buttons">
						<Button 
							text={translate('commonBack')} 
							color="blank" 
							size={36}
							onClick={() => U.Space.openDashboardOrVoid()} 
						/>
					</div>
				) : <Loader />}
			</Frame>

			<Footer component="mainObject" {...props} />
		</div>
	);


});

export default PageMainOneToOne;
