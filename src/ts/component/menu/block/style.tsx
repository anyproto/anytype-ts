import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, MenuItemVertical } from 'ts/component';
import { I, Key, dispatcher } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.Menu {
	commonStore?: any;
	blockStore?: any;
};

const $ = require('jquery');

@inject('commonStore')
@inject('blockStore')
@observer
class MenuBlockStyle extends React.Component<Props, {}> {
	
	n: number = -1;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { blockStore, param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const { blocks } = blockStore;
		const block = blocks[rootId].find((it: I.Block) => { return it.id == blockId; });
		const { content } = block;
		const items = this.getItems();
		
		return (
			<div>
				{items.map((item: any, i: number) => {
					return <MenuItemVertical key={i} {...item} className={(item.id == content.style ? 'active' : '')} onClick={(e: any) => { this.onClick(e, item.id); }} />;
				})}
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
	
	getItems () {
		return [
			{ id: I.TextStyle.Paragraph, icon: 'text', name: 'Text' },
			{ id: I.TextStyle.Header1, icon: 'header1', name: 'Heading 1' },
			{ id: I.TextStyle.Header2, icon: 'header2', name: 'Heading 2' },
			{ id: I.TextStyle.Header3, icon: 'header3', name: 'Heading 3' },
			{ id: I.TextStyle.Quote, icon: 'quote', name: 'Highlighted' },
			{ id: I.TextStyle.Code, icon: 'code', name: 'Code snippet' },
			{ id: I.TextStyle.Bulleted, icon: 'list', name: 'Bulleted list' },
			{ id: I.TextStyle.Numbered, icon: 'numbered', name: 'Numbered list' },
			{ id: I.TextStyle.Toggle, icon: 'toggle', name: 'Toggle' },
			{ id: I.TextStyle.Checkbox, icon: 'checkbox', name: 'Checkbox' },
		];
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
					this.onClick(e, item.id);
				};
				break;
			
			case Key.left:	
			case Key.escape:
				commonStore.menuClose(this.props.id);
				break;
		};
	};
	
	onClick (e: any, id: I.TextStyle) {
		const { commonStore, param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		commonStore.menuClose(this.props.id);
		onSelect(id);
	};

};

export default MenuBlockStyle;