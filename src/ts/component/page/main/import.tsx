import React, { forwardRef, useState, useEffect, useRef } from 'react';
import { Loader, Title, Error, Frame, Button } from 'Component';
import * as I from 'Interface';

const PageMainImport = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const { isPopup } = props;
	const [ error, setError ] = useState('');

	const resize = () => {
		const obj = U.Dom.getPageFlexContainer(isPopup);
		const wh = isPopup ? (obj?.clientHeight || 0) : window.innerHeight;

		if (nodeRef.current) {
			U.Dom.css(nodeRef.current, { height: `${wh}px` });
		};
	};

	useEffect(() => {
		const { source } = keyboard.getMatch(false).params;

		C.GalleryDownloadManifest(source, (message: any) => {
			if (message.error.code) {
				setError(message.error.description);
			} else {
				U.Space.openDashboardOrVoid();

				window.setTimeout(() => {
					S.Popup.open('usecase', { 
						data: { 
							page: 'item', 
							object: message.info, 
							route: analytics.route.usecaseSite,
						},
					});
				}, S.Popup.getTimeout());
			};
		});
	}, []);

	useEffect(() => resize());

	return (
		<div ref={nodeRef} className="wrapper" >
			<Frame>
				<Title text={error ? translate('commonError') : translate('pageMainImportTitle')} />
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
		</div>
	);

});

export default PageMainImport;