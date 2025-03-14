import React, { forwardRef, useState, useEffect, useRef } from 'react';
import $ from 'jquery';
import { Loader, Title, Error, Frame, Button } from 'Component';
import { I, C, S, U, translate, analytics } from 'Lib';

const PageMainImport = forwardRef<{}, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const { isPopup } = props;
	const [ error, setError ] = useState('');

	const resize = () => {
		const win = $(window);
		const obj = U.Common.getPageFlexContainer(isPopup);
		const wh = isPopup ? obj.height() : win.height();

		$(nodeRef.current).css({ height: wh });
	};

	useEffect(() => {
		const search = U.Common.searchParam(U.Router.history.location.search);

		C.GalleryDownloadManifest(search.source, (message: any) => {
			if (message.error.code) {
				setError(message.error.description);
			} else {
				U.Space.openDashboard();

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
							className="c36" 
							onClick={() => U.Space.openDashboard()} 
						/>
					</div>
				) : <Loader />}
			</Frame>
		</div>
	);

});

export default PageMainImport;