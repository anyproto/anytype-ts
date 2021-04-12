import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, keyboard, Key, C, focus, Action, SmileUtil, Util, DataUtil, Storage, translate } from 'ts/lib';
import { blockStore, commonStore, dbStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const $ = require('jquery');
const Constant = require('json/constant.json');

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

						if (action.isObject) {
							action.object = { 
								iconEmoji: action.iconEmoji, 
								decription: action.description,
								layout: I.ObjectLayout.ObjectType,
							};
							action.iconSize = 40;
						};
						
						return (
							<MenuItemVertical 
								key={action.id + '-' + i} 
								{...action} 
								className={action.isHidden ? 'isHidden' : ''}
								withDescription={action.isBlock} 
								onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} 
								onClick={(e: any) => { this.onClick(e, action); }} 
							/>
						);
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
		const { getId } = this.props;
		const items = this.getItems();
		
		this._isMounted = true;
		this.rebind();
		this.checkFilter();
		this.setActive(items[this.n]);
		
		const menu = $('#' + getId());
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
		this.props.setHover(items[this.n], scroll);
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
		const { config } = commonStore;
		
		if (!block) {
			return [];
		};
		
		let sections: any[] = [
			{ id: 'text', name: 'Text', color: 'yellow', children: DataUtil.menuGetBlockText() },
			{ id: 'list', name: 'List', color: 'green', children: DataUtil.menuGetBlockList() },
			{ id: 'object', name: 'Object', color: 'gray', children: DataUtil.menuGetBlockObject() },
			{ id: 'relation', name: 'Relation', color: 'violet', children: DataUtil.menuGetBlockRelation() },
			{ id: 'other', name: 'Other', color: 'purple', children: DataUtil.menuGetBlockOther() },
		];

		if (!config.allowDataview) {
			sections = sections.filter((it: any) => {
				return [ 'relation' ].indexOf(it.id) < 0;
			});
		};
		
		if (filter && filter.text) {
			sections = sections.concat([
				{ id: 'action', icon: 'action', name: 'Actions', color: '', children: DataUtil.menuGetActions(false) },
			]);

			if (block.canHaveAlign()) {
				sections.push({ id: 'align', icon: 'align', name: 'Align', color: '', children: DataUtil.menuGetAlign(block.isTextQuote()) });
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

		const { param, getId, getSize, close } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;

		let menuId = '';
		let menuParam: I.MenuParam = {
			menuKey: item.itemId,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			passThrough: true,
			className: param.className,
			data: {
				rootId: rootId,
				skipId: rootId,
				blockId: blockId,
				blockIds: [ blockId ],
				position: I.BlockPosition.Bottom,
				onSelect: close,
			},
		};

		switch (item.itemId) {	
			case 'move':
				menuId = 'searchObject';
				menuParam.offsetY = -36;

				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.Move, 
				});
				break;

			case 'existing':
				menuId = 'searchObject';
				menuParam.offsetY = -64;

				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.Link, 
				});
				break;
		};

		if (menuId && !menuStore.isOpen(menuId, item.itemId)) {
			menuStore.closeAll(Constant.menuIds.add, () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};
	
	onClick (e: any, item: any) {
		e.stopPropagation();

		if (item.arrow) {
			return;
		};
		
		const { param, close, getId } = this.props;
		const { data } = param;
		const { rootId, blockId, onSelect, blockCreate } = data;
		const { filter } = commonStore;
		const block = blockStore.getLeaf(rootId, blockId);
		if (!block) {
			return;
		};

		let text = String(data.text || '');

		const length = text.length;
		const position = length ? I.BlockPosition.Bottom : I.BlockPosition.Replace; 
		const onCommand = (message: any) => {
			focus.set(message.blockId || blockId, { from: length, to: length });
			focus.apply();
		};

		const cb = () => {
			text = Util.stringCut(text, filter.from - 1, filter.from + filter.text.length);

			if (item.isTextColor) {
				C.BlockListSetTextColor(rootId, [ blockId ], item.value, onCommand);
			};

			if (item.isBgColor) {
				C.BlockListSetBackgroundColor(rootId, [ blockId ], item.value, onCommand);
			};

			if (item.isAlign) {
				C.BlockListSetAlign(rootId, [ blockId ], item.itemId, onCommand);
			};

			if (item.isAction) {
				switch (item.itemId) {
					case 'download':
						Action.download(block);
						break;

					case 'copy':
						Action.duplicate(rootId, blockId, [ blockId ]);
						break;
					
					case 'remove':
						Action.remove(rootId, blockId, [ blockId ]);
						break;
				};
			};

			if (item.isBlock) {
				let param: any = {
					type: item.type,
					content: {},
				};
					
				if (item.type == I.BlockType.Text) {
					param.content.style = item.itemId;

					if (param.content.style == I.TextStyle.Code) {
						param.fields = { 
							lang: (Storage.get('codeLang') || Constant.default.codeLang),
						};
					};
				};

				if (item.type == I.BlockType.File) {
					param.content.type = item.itemId;
				};
				
				if (item.type == I.BlockType.Div) {
					param.content.style = item.itemId;
				};
				
				if (item.type == I.BlockType.Page) {
					const details: any = {};
					
					if (item.isObject) {
						const type = dbStore.getObjectType(item.objectTypeId);
						if (type) {
							details.type = type.id;
							details.layout = type.layout;
						};
					};

					DataUtil.pageCreate(rootId, blockId, details, position, '', (message: any) => {
						DataUtil.objectOpenPopup({ ...details, id: message.targetId });
					});
				} else {
					blockCreate(block, position, param);
				};
			};

			close();
		};

		if (onSelect) {
			onSelect(e, item);
		};

		// Clear filter in block text
		if (block) {
			// Hack to prevent onBlur save
			$(`#block-${blockId} .value`).text(text);
			DataUtil.blockSetText(rootId, block, text, block.content.marks, true, cb);
		} else {
			cb();
		};
	};

};

export default MenuBlockAdd;