import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Title, Smile, Icon, Button } from 'ts/component';
import { I, Util } from 'ts/lib';
import { authStore, commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

const $ = require('jquery');

interface Props extends I.Popup {
	type: string;
};

@observer
class PopupTree extends React.Component<Props, {}> {
	
	id: string = '';
	
	constructor (props: any) {
		super (props);
		
		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { param, } = this.props;
		const { data } = param;
		const { rootId, type } = data;
		const { account } = authStore;
		const tree = blockStore.wrapTree(rootId); 
		
		const home = { 
			id: 'root', 
			content: { 
				fields: { name: account.name || 'Home' } 
			}, 
			childBlocks: tree.childBlocks,
		};
		const items = [ home ];
		const titles: any = {
			copy: 'Duplicate to',
			move: 'Move to',
			link: 'Link to'
		};
		
		const Item = (item: any) => {
			let content = item.content || {};
			let fields = content.fields || {};
			return (
				<div>
					<div id={'item' + item.id} className={'item c' + item.index + (item.childBlocks.length ? ' withChildren' : '')}>
						<div className="arrow" onMouseDown={(e: any) => { this.onToggle(e, item.id); }}>
							<div className="dot" />
						</div>
						<span onMouseDown={(e: any) => { this.onClick(e, item.id); }}>
							{item.id == 'root' ? <Icon className="home" /> : <Smile icon={fields.icon} />}
							<div className="name">
								<div className="txt">{fields.name}</div>
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
		};
		
		return (
			<div>
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
			</div>
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
	};
	
	onClick (e: any, id: string) {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.item.selected').removeClass('selected');
		node.find('#item' + $.escapeSelector(id)).addClass('selected');
		
		this.id = id;
	};
	
	onConfirm (e: any) {
		const { param } = this.props;
		const { root } = blockStore;
		const { data } = param;
		const { onConfirm } = data;
		const block = blockStore.getLeaf(root, this.id);
		
		if (!block) {
			return;
		};
		
		commonStore.popupClose(this.props.id);
		onConfirm(block.content.targetBlockId);
	};
	
	onCancel (e: any) {
		commonStore.popupClose(this.props.id);
	};
	
};

export default PopupTree;