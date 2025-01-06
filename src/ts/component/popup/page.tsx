import React, { forwardRef, useEffect } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { I, S, J, history as historyPopup, keyboard } from 'Lib';
import { Page } from 'Component';

interface Props extends I.Popup, RouteComponentProps<any> {};

const PopupPage = observer(forwardRef<{}, Props>((props, ref) => {
	
	const { param, getId, position } = props;
	const { data } = param;
	const { matchPopup } = data;

	const rebind = () => {
		unbind();
		
		const win = $(window);
		const obj = $(`#${getId()}`);

		win.on('resize.popupPage', () => resize());
		obj.find('.innerWrap').on('scroll.common', () => S.Menu.resizeAll());
	};

	const unbind = () => {
		const win = $(window);
		const obj = $(`#${getId()}`);

		win.off('resize.popupPage');
		obj.find('.innerWrap').off('scroll.common');
	};

	const resize = () => {
		const obj = $(`#${getId()}-innerWrap`);
		const loader = obj.find('#loader');

		loader.css({ width: obj.width(), height: obj.height() });
		position();

		raf(() => { obj.css({ top: J.Size.header + 20, marginTop: 0 }); });
	};

	useEffect(() => {
		rebind();
		resize();

		historyPopup.pushMatch(matchPopup);

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

}));

export default PopupPage;