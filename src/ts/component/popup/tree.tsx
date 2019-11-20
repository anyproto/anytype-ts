import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Title, Smile, Icon, Button } from 'ts/component';
import { I, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';

const $ = require('jquery');

interface Props extends I.Popup {
	blockStore?: any;
	commonStore?: any;
	type: string;
};

@inject('commonStore')
@inject('blockStore')
@observer
class PopupTree extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super (props);
		
		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { blockStore } = this.props;
		const { blocks, root } = blockStore;
		const tree = blockStore.prepareTree(root, blocks); 
		//const { type } = this.props;
		
		const home = { id: 'root', content: {}, fields: { name: 'Home' }, childBlocks: tree };
		const items = [ home ];
		const titles: any = {
			copy: 'Duplicate to',
			move: 'Move to',
			link: 'Link to'
		};
		const type = 'copy'; 
		
		const Item = (item: any) => (
			<div>
				<div id={'item' + item.id} className={'item c' + item.index + (item.childBlocks.length ? ' withChildren' : '')}>
					<div className="arrow" onMouseDown={(e: any) => { this.onToggle(e, item.id); }}>
						<div className="dot" />
					</div>
					<span onMouseDown={(e: any) => { this.onClick(e, item.id); }}>
						{item.id == 'root' ? <Icon className="home" /> : <Smile icon={item.fields.icon} />}
						<div className="name">
							<div className="txt">{item.fields.name}</div>
						</div>
					</span>
				</div>
				{item.childBlocks.length ? (
					<div id={'children' + item.id} className="children">
						{item.childBlocks.map((child: any, i: number) => {
							let index = item.index + 1;
							return <Item key={i} {...this.props} {...child} index={index} />;
						})}
					</div>
				) : ''}
			</div>
		);
		
		return (
			<React.Fragment>
				<div className="head">
					<Title text={titles[type]} />
				</div>
				
				<div className="items">
					{items.map((item: any, i: number) => {
						return <Item key={item.id} {...item} index={1} />;
					})}
				</div>
				
				<div className="buttons">
					<Button text="Confirm" className="orange" onClick={this.onConfirm} />
					<Button text="Cancel" className="grey" onClick={this.onCancel} />
				</div>
			</React.Fragment>
		);
	};
	
	onToggle (e: any, id: string) {
		let node = $(ReactDOM.findDOMNode(this));
		let item = node.find('#item' + id);
		let children = node.find('#children' + id);
		let isActive = item.hasClass('active');
		let height = 0;
		
		if (isActive) {
			item.removeClass('active');
			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();
			children.css({ overflow: 'hidden', height: height });

			setTimeout(() => { children.css({ height: 0 }); }, 15);
			setTimeout(() => { children.hide(); }, 215);
		} else {
			item.addClass('active');
			children.show();
			children.css({ overflow: 'visible', height: 'auto' });
			height = children.height();

			children.css({ overflow: 'hidden', height: 0 });
			setTimeout(() => { children.css({ height: height }); }, 15);
			setTimeout(() => { children.css({ overflow: 'visible', height: 'auto' }); }, 215);
		};
		
		setTimeout(() => {
		}, 215);
	};
	
	onClick (e: any, id: string) {
		let node = $(ReactDOM.findDOMNode(this));
		node.find('.item.selected').removeClass('selected');
		node.find('#item' + id).addClass('selected');
	};
	
	onConfirm (e: any) {
		const { commonStore } = this.props;
		commonStore.popupClose(this.props.id);	
	};
	
	onCancel (e: any) {
		const { commonStore } = this.props;
		commonStore.popupClose(this.props.id);
	};
	
	copy () {
	};
	
	move () {
	};
	
	link () {
	};
	
};

export default PopupTree;