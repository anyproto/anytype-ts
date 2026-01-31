import React, { forwardRef, useRef, useEffect, useLayoutEffect } from 'react';
import $ from 'jquery';
import { Icon, Label, Button } from 'Component';
import { I, S, U, H, translate, Action } from 'Lib';

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
			if (home && (home.id == I.HomePredefinedId.Last)) {
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
		const node = $(nodeRef.current);
		const container = isPopup ? $('#popupPage-innerWrap') : $(window);

		node.css({ height: container.height() });
	};

	const onResize = H.useDebounceCallback(resize, 50);

	H.useResizeObserver({ ref: nodeRef, onResize });

	useEffect(() => {
		resize();
	});

	useLayoutEffect(() => resize());

	return (
		<div 
			ref={nodeRef}
			id="deleteWrapper" 
			className={[ 'deleteWrapper', className ].join(' ')}
		>
			<div className="mid">
				<Icon className="ghost" />
				<Label text={translate('utilDeletedObjectNotExist')} />
				<Button color="blank" text={textButton} onClick={onClick} />
			</div>
		</div>
	);

});

export default Deleted;
