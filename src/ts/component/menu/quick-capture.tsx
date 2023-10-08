import * as React from 'react';
import $ from 'jquery';
import { MenuItemVertical } from 'Component';
import { analytics, C, I, keyboard, UtilObject, translate, Action, Preview } from 'Lib';
import { commonStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

class MenuQuickCapture extends React.Component<I.Menu> {

	n = 0;

	constructor (props: I.Menu) {
		super(props);
	};

	render () {
		const items = this.getItems();

		return (
			<div className="quickCaptureWrapper">
				AAAA
				{items.map((item: any, i: number) => (
					<div onClick={e => this.onClick(e, item)}>{item.name}</div>
				))}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {

		return [

		].filter(it => it);
	};

	onClick (e: any, item: any) {
		const { param, close } = this.props;

		close();

		switch (item.id) {
			case 'default': {

				break;
			};

		};
	};

	onMouseEnter (e: any, item: any) {
		this.onOver(e, item);
	};

	onOver (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onOver } = data;

		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};

		if (onOver) {
			onOver();
		};
	};

};

export default MenuQuickCapture;
