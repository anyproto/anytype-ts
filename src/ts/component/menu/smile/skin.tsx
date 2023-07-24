import * as React from 'react';
import { IconObject } from 'Component';
import { I, keyboard, UtilSmile } from 'Lib';
import $ from 'jquery';

const SKINS = [ 1, 2, 3, 4, 5, 6 ];

class MenuSmileSkin extends React.Component<I.Menu> {

	ref = null;
	node: any = null;
	n: number = 0;

	state = {
		filter: ''
	};

	constructor (props: I.Menu) {
		super(props);

		this.onMouseEnter = this.onMouseEnter.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { smileId } = data;
		
		const Item = (item: any) => (
			<div 
				id={`skin-${item.skin}`} 
				className="item" 
				onMouseDown={e => this.onClick(e, item.skin)}
				onMouseEnter={e => this.onMouseEnter(e, item.skin)}
			>
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
		this.setActive();
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
		this.unbind();
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

	onMouseEnter (e: any, id: number) {
		if (!keyboard.isMouseDisabled) {
			this.n = SKINS.indexOf(id);
			this.setActive();
		};
	};

	onKeyDown (e) {
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;

		keyboard.shortcut('arrowleft, arrowright, arrowup, arrowdown', e, (pressed) => {
			e.preventDefault();

			const dir = [ 'arrowleft', 'arrowup' ].includes(pressed) ? -1 : 1;

			this.n += dir;
			if (this.n < 0) {
				this.n = SKINS.length - 1;
			} else
			if (this.n >= SKINS.length) {
				this.n = 0;
			};

			this.setActive();
		});

		keyboard.shortcut('enter, space, tab', e, () => {
			e.preventDefault();
			e.stopPropagation();

			if (SKINS[this.n]) {
				onSelect(SKINS[this.n]);
				close();
			};
		});
	};

	setActive () {
		const node = $(this.node);

		node.find('.active').removeClass('active');
		node.find(`#skin-${SKINS[this.n]}`).addClass('active');
	};
	
};

export default MenuSmileSkin;