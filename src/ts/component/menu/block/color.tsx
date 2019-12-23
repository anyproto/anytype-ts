import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, Key } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

@inject('commonStore')
@observer
class MenuBlockColor extends React.Component<Props, {}> {
	
	n: number = -1;
	
	constructor (props: any) {
		super(props);
		
		this.onTextColor = this.onTextColor.bind(this);
		this.onBgColor = this.onBgColor.bind(this);
	};

	render () {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { valueText, valueBg } = data;
		
		const Item = (item: any) => (
			<div id={item.id} className={item.className} onClick={item.onClick}>
				<div className="txt">A</div>
			</div>
		);

		let id = 0;
		
		return (
			<div>
				<div className="section">
					<div className="name">Text color</div>
					<div className="items">
						{this.getTextColors().map((color: string, i: number) => {
							let cn = [ 'item', 'textColor', 'textColor-' + color, (color == valueText ? 'active' : '') ];
							id++;
							return <Item id={'item-' + id} key={i} className={cn.join(' ')} onClick={(e: any) => { this.onTextColor(e, color); }} />;
						})}
					</div>
				</div>
				
				<div className="section">
					<div className="name">Text highlight</div>
					<div className="items">
						{this.getBgColors().map((color: string, i: number) => {
							let cn = [ 'item', 'bgColor', 'bgColor-' + color, (color == valueBg ? 'active' : '') ];
							id++;
							return <Item id={'item-' + id} key={i} className={cn.join(' ')} onClick={(e: any) => { this.onBgColor(e, color); }} />;
						})}
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.unbind();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	componentWillUnmount () {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { rebind } = data;

		this.unbind();
		
		if (rebind) {
			rebind();
		};
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};
	
	onKeyDown (e: any) {
		e.preventDefault();
		e.stopPropagation();
		
		const { commonStore } = this.props;
		const k = e.which;
		const node = $(ReactDOM.findDOMNode(this));
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		const setActive = () => {
			const item = items[this.n];
			
			node.find('.item.active').removeClass('active');
			node.find('#item-' + item.id).addClass('active');
		};
		
		switch (k) {
			case Key.up:
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				setActive();
				break;
				
			case Key.down:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				setActive();
				break;
				
			case Key.enter:
			case Key.space:
				if (item) {
					if (item.type == I.MarkType.TextColor) {
						this.onTextColor(e, item.color);						
					};
					if (item.type == I.MarkType.BgColor) {
						this.onBgColor(e, item.color);						
					};
				};
				break;
			
			case Key.left:	
			case Key.escape:
				commonStore.menuClose(this.props.id);
				break;
		};
	};
	
	getItems () {
		let items: any[] = [];
		let id = 0;
		for (let c of this.getTextColors()) {
			items.push({ id: ++id, type: I.MarkType.TextColor, color: c });
		};
		for (let c of this.getBgColors()) {
			items.push({ id: ++id, type: I.MarkType.BgColor, color: c });
		};
		return items;
	};
	
	getTextColors () {
		return [ 'black' ].concat(Constant.tagColor);
	};
	
	getBgColors () {
		return Constant.tagColor;
	};
	
	onTextColor (e: any, color: string) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { onChangeText } = data;
		
		if (color == this.getTextColors()[0]) {
			color = '';
		};
		
		commonStore.menuClose(this.props.id);
		onChangeText(color);
	};
	
	onBgColor (e: any, color: string) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { onChangeBg } = data;
		
		if (color == this.getBgColors()[0]) {
			color = '';
		};
		
		commonStore.menuClose(this.props.id);
		onChangeBg(color);
	};
	
};

export default MenuBlockColor;