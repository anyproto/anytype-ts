import React, { forwardRef, useEffect } from 'react';
import $ from 'jquery';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { I, S, J, history as historyPopup, keyboard } from 'Lib';
import { Page } from 'Component';

interface Props extends I.Popup, RouteComponentProps<any> {};

const PopupPage = observer(forwardRef<{}, Props>((props, ref) => {
	
	const { param, getId } = props;
	const { data } = param;
	const { matchPopup } = data;

	const rebind = () => {
		unbind();
		
		$(`#${getId()}`).find('.innerWrap').on('scroll.common', () => S.Menu.resizeAll());
	};

	const unbind = () => {
		$(`#${getId()}`).find('.innerWrap').off('scroll.common');
	};

	useEffect(() => {
		rebind();

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
