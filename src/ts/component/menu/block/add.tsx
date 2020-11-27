import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, keyboard, Key, Util, DataUtil, translate } from 'ts/lib';
import { blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');

@observer
class MenuBlockAdd extends React.Component<Props, {}> {
	
	_isMounted = false;
	n: number = 0;
	emptyLength: number = 0;
	timeout: number = 0;
	
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
								<div className={icn.join(' ')} />
							);
						};
						
						return <MenuItemVertical key={action.id + '-' + i} {...action} withDescription={action.isBlock} onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} onClick={(e: any) => { this.onClick(e, action); }} />;
					})}
				</div>
			</div>
		);
		
		return (
			<div>
				{!sections.length ? <div className="item empty">{translate('commonFilterEmpty')}</div> : ''}
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		const { id } = this.props;
		const items = this.getItems();
		
		this._isMounted = true;
		this.rebind();
		this.checkFilter();
		this.setActive(items[this.n]);
		
		const menu = $('#' + Util.toCamelCase('menu-' + id));
		menu.unbind('mouseleave').on('mouseleave', () => {
			window.clearTimeout(this.timeout);
		});
	};
	
	componentDidUpdate () {
		const { filter } = commonStore;
		const items = this.getItems();

		if (!items.length && !this.emptyLength) {
			this.emptyLength = filter.text.length;
		};

		if ((filter.text.length - this.emptyLength > 3) && !items.length) {
			this.props.close();
			return;
		};

		this.checkFilter();
		this.setActive(items[this.n]);
		this.props.position();
	};
	
	checkFilter () {
		const { filter } = commonStore;
		const obj = $('#menuBlockAdd');
		
		filter ? obj.addClass('withFilter') : obj.removeClass('withFilter');
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
		this.props.setActiveItem(items[this.n], scroll);
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();
		keyboard.disableMouse(true);
		
		const k = e.key.toLowerCase();
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];

		switch (k) {
			case Key.up:
				e.preventDefault();
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				this.setActive(null, true);
				break;
				
			case Key.down:
				e.preventDefault();
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
				break;
				
			case Key.tab:
			case Key.enter:
				e.preventDefault();
				
				if (item) {
					item.arrow ? this.onOver(e, item) : this.onClick(e, item);					
				};
				break;
			
			case Key.escape:
				this.props.close();
				break;
		};
	};
	
	getSections () {
		const { param } = this.props;
		const { filter } = commonStore;
		const { data } = param;
		const { blockId, rootId } = data;
		const block = blockStore.getLeaf(rootId, blockId);
		
		if (!block) {
			return [];
		};
		
		let sections: any[] = [
			{ id: 'text', icon: 'text', name: 'Text', color: 'yellow', children: DataUtil.menuGetBlockText() },
			{ id: 'list', icon: 'list', name: 'List', color: 'green', children: DataUtil.menuGetBlockList() },
			{ id: 'file', icon: 'file', name: 'Object', color: 'blue', children: DataUtil.menuGetBlockObject() },
			{ id: 'relation', icon: 'relation', name: 'Relation', color: 'violet', children: DataUtil.menuGetBlockRelation() },
			{ id: 'other', icon: 'line', name: 'Other', color: 'purple', children: DataUtil.menuGetBlockOther() },
		];
		
		if (filter && filter.text) {
			sections = sections.concat([
				{ id: 'action', icon: 'action', name: 'Actions', color: '', children: DataUtil.menuGetActions(false) },
			]);

			if (block.canHaveAlign()) {
				sections.push({ id: 'align', icon: 'align', name: 'Align', color: '', children: DataUtil.menuGetAlign(false) });
			};
			if (block.canHaveColor()) {
				sections.push({ id: 'color', icon: 'color', name: 'Text color', color: '', children: DataUtil.menuGetTextColors() });
			};
			if (block.canHaveBackground()) {
				sections.push({ id: 'bgColor', icon: 'bgColor', name: 'Background color', color: '', children: DataUtil.menuGetBgColors() });
			};
			
			sections = DataUtil.menuSectionsFilter(sections, filter.text);
		};
		
		sections = DataUtil.menuSectionsMap(sections);
		return sections;
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};
	
	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.onOver(e, item);
		};
	};
	
	onOver (e: any, item: any) {
		this.setActive(item, false);
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
		onSelect(e, item);
	};
	
};

export default MenuBlockAdd;