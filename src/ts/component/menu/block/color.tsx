import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
};

const Constant = require('json/constant.json');

@inject('commonStore')
@observer
class MenuBlockColor extends React.Component<Props, {}> {
	
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
			<div className={item.className} onClick={item.onClick}>
				<div className="txt">A</div>
			</div>
		);
		
		return (
			<React.Fragment>
				<div className="section">
					<div className="name">Text color</div>
					<div className="items">
						{this.getTextColors().map((color: string, i: number) => {
							let cn = [ 'item', 'textColor', 'textColor-' + color, (color == valueText ? 'active' : '') ];
							return <Item key={i} className={cn.join(' ')} onClick={(e: any) => { this.onTextColor(e, color); }} />;
						})}
					</div>
				</div>
				
				<div className="section">
					<div className="name">Text highlight</div>
					<div className="items">
						{this.getBgColors().map((color: string, i: number) => {
							let cn = [ 'item', 'bgColor', 'bgColor-' + color, (color == valueBg ? 'active' : '') ];
							return <Item key={i} className={cn.join(' ')} onClick={(e: any) => { this.onBgColor(e, color); }} />;
						})}
					</div>
				</div>
			</React.Fragment>
		);
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