import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, keyboard, Key, Util, DataUtil } from 'ts/lib';
import { blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');

@observer
class MenuBlockAdd extends React.Component<Props, {}> {
	
	_isMounted = false;
	n: number = -1;
	t: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { filter } = commonStore;
		const options = this.getItems();
		const sections = this.getSections();
		
		const Item = (item: any) => (
			<div id={'item-' + item.id} className={[ 'item', item.color, (item.color ? 'withColor' : ''), (item.arrow ? 'withChildren' : '') ].join(' ')} onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} onClick={(e: any) => { this.onClick(e, item); }}>
				{item.icon ? <Icon className={item.icon} inner={item.inner} /> : ''}
				<div className="name">{item.name}</div>
				{item.arrow ? <Icon className="arrow" /> : ''}
			</div>
		);
		
		const Section = (item: any) => (
			<div className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
						let icn: string[] = [ 'inner' ];
						
						if (action.isBlock) {
							action.color = item.color;
						};
						
						if (action.isTextColor) {
							icn.push('textColor textColor-' + action.value);
						};
						if (action.isBgColor) {
							icn.push('bgColor bgColor-' + action.value);
						};
						
						if (action.isTextColor || action.isBgColor) {
							action.icon = 'color';
							action.inner = (
								<div className={icn.join(' ')}>A</div>
							);
						};
						
						return <Item key={i} {...action} />;
					})}
				</div>
			</div>
		);
		
		return (
			<div>
				{filter ? (
					<React.Fragment>
						{!sections.length ? <div className="item empty">No items match filter</div> : ''}
						{sections.map((item: any, i: number) => (
							<Section key={i} {...item} />
						))}
					</React.Fragment>
				) : (
					<React.Fragment>
						{options.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</React.Fragment>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.checkFilter();
		
		if (this.props.id == 'blockAddSub') {
			this.n = 0;
			this.setActive();
		};
	};
	
	componentDidUpdate () {
		this.checkFilter();
	};
	
	checkFilter () {
		const { filter } = commonStore;
		const obj = $('#menuBlockAdd');
		
		if (filter) {
			obj.addClass('withFilter');
			commonStore.menuClose('blockAddSub');
		} else {
			obj.removeClass('withFilter');
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		
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
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id });
		};
		Util.menuSetActive(this.props.id, items[this.n], 12, scroll);
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();
		keyboard.disableMouse(true);
		
		const { param } = this.props;
		const { data } = param;
		const k = e.which;
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		switch (k) {
			case Key.up:
				if (this.n == -1) {
					commonStore.menuClose(this.props.id);
					break;
				};
			
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				this.setActive(null, true);
				break;
				
			case Key.down:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
				break;
				
			case Key.right:
				if ((this.props.id == 'blockAddSub') && (this.n == -1)) {
					this.n++;
					if (this.n > l - 1) {
						this.n = 0;
					};
					this.setActive();
				} else 
				if (item) {
					this.onOver(e, item);
				};
				break;
				
			case Key.enter:
			case Key.space:
				e.preventDefault();
				
				if (item) {
					item.arrow ? this.onOver(e, item) : this.onClick(e, item);					
				};
				break;
			
			case Key.left:	
			case Key.escape:
				commonStore.menuClose(this.props.id);
				break;
		};
	};
	
	getSections () {
		const { param } = this.props;
		const { filter } = commonStore;
		const { data } = param;
		const { blockId, rootId } = data;
		const list = blockStore.blocksGet(rootId);
		const block = list.find((item: I.Block) => { return item.id == blockId; });
		
		if (!block) {
			return [];
		};
		
		const { type, content } = block;
		
		let sections: any[] = [
			{ id: 'text', icon: 'text', name: 'Text', color: 'yellow', arrow: true, children: DataUtil.menuGetBlockText() },
			{ id: 'list', icon: 'list', name: 'List', color: 'green', arrow: true, children: DataUtil.menuGetBlockList() },
			{ id: 'page', icon: 'page', name: 'Page', color: 'blue', arrow: true, children: DataUtil.menuGetBlockPage() },
			{ id: 'file', icon: 'file', name: 'Object', color: 'red', arrow: true, children: DataUtil.menuGetBlockObject() },
			{ id: 'other', icon: 'line', name: 'Other', color: 'purple', arrow: true, children: DataUtil.menuGetBlockOther() },
		];
		
		if (filter) {
			const reg = new RegExp(filter, 'gi');
			
			sections = sections.concat([
				{ id: 'action', icon: 'action', name: 'Actions', color: '', arrow: true, children: DataUtil.menuGetActions(block) },
				{ id: 'align', icon: 'align', name: 'Align', color: '', arrow: true, children: DataUtil.menuGetAlign() },
				{ id: 'bgColor', icon: 'bgColor', name: 'Background color', color: '', arrow: true, children: DataUtil.menuGetBgColors() },
			]);
			
			if ((type == I.BlockType.Text) && (content.style != I.TextStyle.Code)) {
				sections.push({ id: 'color', icon: 'color', name: 'Text color', color: '', arrow: true, children: DataUtil.menuGetTextColors() });
			};
			
			sections = sections.filter((s: any) => {
				s.children = (s.children || []).filter((c: any) => { return c.name.match(reg); });
				return s.children.length > 0;
			});
		};
		
		return sections;
	};
	
	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { id } = data;
		const sections = this.getSections();
		const { filter } = commonStore;
		
		let options: any[] = sections;
		
		if (id) {
			const item = options.find((it: any) => { return it.id == id; });
			if (!item) {
				return [];
			};
			
			options = item.children;
			for (let i in options) {
				options[i] = Object.assign(options[i], {
					parentId: item.id,
					color: item.color,
					children: [],
				});
			};
		};
		
		if (filter) {
			let reg = new RegExp(filter, 'gi');
			let list: any[] = [];
			
			for (let item of options) {
				list = list.concat(item.children || []);
			};
			
			options = list.filter((it: any) => { return it.name.match(reg); });
		};
		
		return options;
	};
	
	onMouseEnter (e: any, item: any) {
		if (keyboard.mouse) {
			this.onOver(e, item);
		};
	};
	
	onOver (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, onSelect } = data;
		
		this.setActive(item, false);
		
		if (!item.arrow || !commonStore.menuIsOpen('blockAdd')) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const offsetX = node.outerWidth() + 1;

		commonStore.menuOpen('blockAddSub', { 
			element: '#item-' + item.id,
			type: I.MenuType.Vertical,
			offsetX: offsetX,
			offsetY: -40,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				rootId: rootId,
				blockId: blockId,
				id: item.id,
				onSelect: onSelect,
				rebind: this.rebind,
			}
		});
	};
	
	onClick (e: any, item: any) {
		e.stopPropagation();
		
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		if (item.arrow) {
			return;
		};
		
		commonStore.menuClose('blockAdd');
		commonStore.menuClose('blockAddSub');
		onSelect(e, item);
	};
	
};

export default MenuBlockAdd;