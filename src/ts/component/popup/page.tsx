import React, { forwardRef, useRef, useEffect } from 'react';
import { history as historyPopup } from 'Lib/history';
import { Page } from 'Component';
import * as I from 'Interface';

interface Props extends I.Popup {};

const PopupPage = forwardRef<{}, Props>((props, ref) => {
	
	const { param, getId } = props;
	const { data } = param;
	const { matchPopup } = data;
	const scrollHandlerRef = useRef<(() => void) | null>(null);

	const getInnerWrap = (): HTMLElement | null => {
		const container = U.Dom.get(getId());
		return container ? U.Dom.select('.innerWrap', container) : null;
	};

	const rebind = () => {
		unbind();
		scrollHandlerRef.current = () => S.Menu.resizeAll();
		const wrap = getInnerWrap();
		if (wrap) {
			U.Dom.addEvent(wrap, 'scroll', scrollHandlerRef.current);
		};
	};

	const unbind = () => {
		if (scrollHandlerRef.current) {
			const wrap = getInnerWrap();
			if (wrap) {
				U.Dom.removeEvent(wrap, 'scroll', scrollHandlerRef.current);
			};
			scrollHandlerRef.current = null;
		};
	};

	useEffect(() => {
		rebind();
		historyPopup.pushMatch(matchPopup);

		S.Common.clearRightSidebarState(true);
		sidebar.init(true);

		return () => {
			unbind();
			historyPopup.clear();
			keyboard.setWindowTitle();
		};
	}, []);

	return (
		<div id="wrap">
			<Page 
				{...props}
				rootId={matchPopup.params.id} 
				isPopup={true} 
				matchPopup={matchPopup} 
			/>
		</div>
	);

});

export default PopupPage;
