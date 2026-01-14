import React, { forwardRef, useRef, useEffect, useImperativeHandle, useState } from 'react';
import { Loader, Error, Frame, Button, Footer } from 'Component';
import { U, I, keyboard, translate, analytics } from 'Lib';

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
		const win = $(window);
		const obj = U.Common.getPageFlexContainer(isPopup);
		const node = $(nodeRef.current);
		const oh = obj.height();
		const wh = isPopup ? oh : win.height();

		node.css({ height: wh });
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
							className="c36" 
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
