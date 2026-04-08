import React, { forwardRef, useRef, useEffect, useLayoutEffect } from 'react';
import { Icon, Label, Button } from 'Component';
import * as I from 'Interface';

interface Props {
	className?: string;
	isPopup?: boolean;
};

const Deleted = forwardRef<HTMLDivElement, Props>(({
	className = '',
	isPopup = false,
}, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);
	const onClick = () => {
		if (isPopup) {
			S.Popup.close('page');
		} else {
			const home = U.Space.getDashboard();

			let last = null;
			if (home && [ '', I.HomePredefinedId.Last, I.HomePredefinedId.Widget ].includes(home.id)) {
				last = U.Space.getLastObject();
			};

			if (last) {
				U.Object.getById(home.id, {}, object => {
					if (!object || object.isDeleted) {
						Action.openSettings('storageManager', '', { replace: true });
					} else {
						U.Space.openDashboard();
					};
				});
			} else {
				U.Space.openDashboard();
			};
		};
	};
	const textButton = isPopup ? translate('commonClose') : translate('utilDeletedBackToDashboard');

	const resize = () => {
		const container = U.Dom.getPageContainer(isPopup);

		if (nodeRef.current && container) {
			U.Dom.css(nodeRef.current, { height: `${container.clientHeight}px` });
		};
	};

	useEffect(() => {
		const handler = () => resize();

		U.Dom.addEvent(window, 'resize', handler);
		resize();

		return () => U.Dom.removeEvent(window, 'resize', handler);
	});

	useLayoutEffect(() => resize());

	return (
		<div 
			ref={nodeRef}
			id="deleteWrapper" 
			className={[ 'deleteWrapper', className ].join(' ')}
		>
			<div className="mid">
				<Icon name="common/ghost" className="ghost" />
				<Label text={translate('utilDeletedObjectNotExist')} />
				<Button color="blank" text={textButton} onClick={onClick} />
			</div>
		</div>
	);

});

export default Deleted;
