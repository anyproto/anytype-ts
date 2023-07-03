import * as React from 'react';
import { IconObject } from 'Component';
import { I, keyboard, UtilSmile } from 'Lib';
import $ from 'jquery';

const SKINS = [ 1, 2, 3, 4, 5, 6 ];

class MenuSmileSkin extends React.Component<I.Menu> {

	ref = null;
	node: any = null;
	n: number = -1;

	state = {
		filter: ''
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { smileId } = data;
		
		const Item = (item: any) => (
			<div id={`skin-${item.skin}`} className="item" onMouseDown={e => this.onClick(e, item.skin)}>
				<IconObject size={32} object={{ iconEmoji: UtilSmile.nativeById(smileId, item.skin) }} />
			</div>
		);
		
		return (
			<div ref={(node: any) => this.node = node}>
				{SKINS.map((skin: any, i: number) => (
					<Item key={i} skin={skin} />
				))}
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	componentWillUnmount () {
		const { param } = this.props;
		const { data } = param;
		const { rebind } = data;

		this.unbind();

		if (rebind) {
			rebind();
		};
	};

	rebind () {
		$(window).on('keydown.menu', e => this.onKeyDown(e));
	};

	unbind () {
		$(window).off('keydown.menu');
	};

	onClick (e: any, id: number) {
		e.preventDefault();
		e.stopPropagation();

		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;

		onSelect(id);
		close();
	};

	onKeyDown (e) {
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;

		keyboard.shortcut('arrowup, arrowdown', e, () => {
			e.preventDefault();
		});

		keyboard.shortcut('arrowleft, arrowright', e, (pressed) => {
			e.preventDefault();

			const node = $(this.node);
			const dir = pressed == 'arrowleft' ? -1 : 1;

			this.n += dir;
			if (this.n < 0) {
				this.n = SKINS.length - 1;
			} else
			if (this.n >= SKINS.length) {
				this.n = 0;
			};

			node.find('.active').removeClass('active');
			node.find(`#skin-${SKINS[this.n]}`).addClass('active');
		});

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			e.stopPropagation();

			if (SKINS[this.n]) {
				onSelect(SKINS[this.n]);
				close();
			};
		});
	};
	
};

export default MenuSmileSkin;