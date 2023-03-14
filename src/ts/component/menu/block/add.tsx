import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { MenuItemVertical, Icon, Cell } from 'Component';
import { I, Mark, keyboard, C, focus, Action, Util, DataUtil, MenuUtil, ObjectUtil, Storage, translate, analytics, Relation } from 'Lib';
import { blockStore, commonStore, dbStore, menuStore, detailStore, popupStore } from 'Store';
import Constant from 'json/constant.json';

const HEIGHT_ITEM = 28;
const HEIGHT_SECTION = 42;
const HEIGHT_DESCRIPTION = 56;
const HEIGHT_RELATION = 32;
const LIMIT = 40;

const MenuBlockAdd = observer(class MenuBlockAdd extends React.Component<I.Menu> {
	
	_isMounted = false;
	emptyLength = 0;
	timeout = 0;
	cache: any = {};
	refList: any = null;
	n = -1;
	filter = '';
	
	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const { filter } = commonStore;
		const items = this.getItems(true);
		const block = blockStore.getLeaf(rootId, blockId);
		const idPrefix = 'menuBlockAdd';

		const rowRenderer = (param: any) => {
			const { index } = param;
			const item: any = items[index];
			
			let content = null;
			if (item.isRelationAdd) {
				content =  (
					<div 
						id="item-relation-add" 
						className="item add" 
						onClick={(e: any) => { this.onClick(e, item); }} 
						onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
						style={param.style}
					>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else 
			if (item.isSection) {
				content = <div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={param.style}>{item.name}</div>;
			} else
			if (item.isRelation) {
				const id = Relation.cellId(idPrefix, item.relationKey, '0');
				const record = detailStore.get(rootId, rootId, [ item.relationKey ]);

				content = (
					<div 
						id={'item-' + item.id}
						className={[ 'item', 'sides', (item.isHidden ? 'isHidden' : '') ].join(' ')} 
						onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }} 
						style={param.style}
					>
						<div className="info">
							{item.name}
						</div>
						<div
							id={id} 
							className={[ 'cell', Relation.className(item.format) ].join(' ')} 
						>
							<Cell 
								rootId={rootId}
								subId={rootId}
								block={block}
								relationKey={item.relationKey}
								getRecord={() => { return record; }}
								viewType={I.ViewType.Grid}
								index={0}
								idPrefix={idPrefix}
								menuClassName="fromBlock"
								bodyContainer={Util.getBodyContainer('menuBlockAdd')}
								pageContainer={Util.getCellContainer('menuBlockAdd')}
								readonly={true}
								canOpen={false}
								placeholder={translate('placeholderCellCommon')}
							/>
						</div>
					</div>
				);
			} else {
				let cn = [];
				let icn: string[] = [ 'inner' ];
					
				if (item.isTextColor) {
					icn.push('textColor textColor-' + (item.value || 'default'));
				};
				if (item.isBgColor) {
					icn.push('bgColor bgColor-' + (item.value || 'default'));
				};
				
				if (item.isTextColor || item.isBgColor) {
					item.icon = 'color';
					item.inner = (
						<div className={icn.join(' ')} />
					);
				};

				if (item.isBig) {
					cn.push('isBig');
				};

				if (item.isHidden) {
					cn.push('isHidden');
				};

				if (item.isObject) {
					item.object = { 
						iconEmoji: item.iconEmoji, 
						decription: item.description,
						layout: I.ObjectLayout.Type,
					};
					item.iconSize = 40;
				};
				
				content = (
					<MenuItemVertical 
						key={item.id + '-' + index} 
						{...item} 
						className={cn.join(' ')}
						withDescription={item.isBlock} 
						onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }} 
						style={param.style}
					/>
				);
			};

			return (
				<CellMeasurer
					{...param}
					cache={this.cache}
					columnIndex={0}
					rowIndex={index}
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
			<div className="wrap">
				{!items.length ? (
					<div className="item empty">{translate('commonFilterEmpty')}</div>
				) : (
					<div className="items">
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={() => {}}
							isRowLoaded={() => true}
							threshold={LIMIT}
						>
							{({ onRowsRendered, registerChild }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={ref => { this.refList = ref; }}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={({ index }) => { return this.getRowHeight(items[index], index); }}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={20}
											scrollToAlignment="center"
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					</div>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		const { getId } = this.props;
		const items = this.getItems(true);
		
		this._isMounted = true;
		this.rebind();
		this.checkFilter();
		this.resize();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});
		
		$(`#${getId()}`).off('mouseleave').on('mouseleave', () => { window.clearTimeout(this.timeout); });
	};
	
	componentDidUpdate () {
		const { filter } = commonStore;
		const items = this.getItems(true);
		const itemsWithoutSections = this.getItems(false);

		if (!itemsWithoutSections.length && !this.emptyLength) {
			this.emptyLength = filter.text.length;
		};

		if ((filter.text.length - this.emptyLength > 3) && !items.length) {
			this.props.close();
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		if (this.filter != filter.text) {
			this.filter = filter.text;
			this.forceUpdate();
			return;
		};

		this.checkFilter();
		this.resize();

		this.props.setActive();
	};

	componentWillUnmount () {
		this._isMounted = false;
		menuStore.closeAll(Constant.menuIds.add);
	};

	checkFilter () {
		const { filter } = commonStore;
		const obj = $('#menuBlockAdd');
		
		filter ? obj.addClass('withFilter') : obj.removeClass('withFilter');
	};
	
	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getRelations () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const { config } = commonStore;
		const relations = dbStore.getObjectRelations(rootId, rootId).filter((it: any) => {
			if (!config.debug.ho && it.isHidden) {
				return false;
			};
			return it.isInstalled;
		}).sort(DataUtil.sortByName).map((it: any) => {
			it.type = I.BlockType.Relation;
			it.isRelation = true;
			it.isBlock = true;
			return it;
		});

		relations.unshift({ id: 'add', name: 'New relation', isRelationAdd: true });

		return relations.map((it: any) => {
			it.type = I.BlockType.Relation;
			it.isRelation = true;
			it.isBlock = true;
			return it;
		});
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
			{ id: 'text', name: 'Text', children: MenuUtil.getBlockText() },
			{ id: 'list', name: 'List', children: MenuUtil.getBlockList() },
			{ id: 'media', name: 'Media', children: MenuUtil.getBlockMedia() },
			{ id: 'other', name: 'Other', children: MenuUtil.getBlockOther() },
			{ id: 'object', name: 'Objects', children: MenuUtil.getBlockObject() },
		].map(s => ({ ...s, children: s.children.map(c => ({ ...c, isBig: true })) }));

		sections = sections.concat([
			{ id: 'relation', name: 'Relations', children: this.getRelations() },
		]);
		
		if (filter && filter.text) {
			const actions = MenuUtil.getActions({ hasFile: false, hasLink: false });

			if (block.canTurnPage()) {
				actions.push({ id: 'turnObject', icon: 'object', name: 'Turn into object', arrow: true });
			};

			sections = sections.concat([
				{ id: 'action', icon: 'action', name: 'Actions', color: '', children: actions },
			]);

			if (block.canHaveAlign()) {
				sections.push({ id: 'align', icon: 'align', name: 'Align', color: '', children: MenuUtil.getAlign(block.isTextQuote()) });
			};
			if (block.canHaveColor()) {
				sections.push({ id: 'color', icon: 'color', name: 'Text color', color: '', children: MenuUtil.getTextColors() });
			};
			if (block.canHaveBackground()) {
				sections.push({ id: 'bgColor', icon: 'bgColor', name: 'Background color', color: '', children: MenuUtil.getBgColors() });
			};
			
			sections = MenuUtil.sectionsFilter(sections, filter.text);
		};
		
		return MenuUtil.sectionsMap(sections);
	};
	
	getItems (withSections: boolean) {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			if (withSections) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};
		return items;
	};
	
	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item);
			this.onOver(e, item);
		};
	};
	
	onOver (e: any, item: any) {
		if (!item.arrow) {
			menuStore.closeAll(Constant.menuIds.add);
			return;
		};

		const { param, getId, getSize, close } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const { filter } = commonStore;
		const types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map(it => it.id);
		const block = blockStore.getLeaf(rootId, blockId);

		let filters = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types },
		];

		const text = Util.stringCut(data.text, filter.from - 1, filter.from + filter.text.length);
		const length = text.length;
		const position = length ? I.BlockPosition.Bottom : I.BlockPosition.Replace;

		let menuId = '';
		let menuParam: I.MenuParam = {
			menuKey: item.itemId,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			data: {
				rebind: this.rebind,
				rootId: rootId,
				skipIds: [ rootId ],
				blockId: blockId,
				blockIds: [ blockId ],
				position: position,
				onSelect: () => {
					$(`#block-${blockId} .value`).text(text);

					DataUtil.blockSetText(rootId, block.id, text, block.content.marks, true, () => {
						focus.set(blockId, { from: length, to: length });
						focus.apply();
					});

					close();
				},
			},
		};

		switch (item.itemId) {	
			case 'move':
				menuId = 'searchObject';
				menuParam.offsetY = -36;

				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.Move, 
					filters: filters,
				});
				break;

			case 'existing':
				menuId = 'searchObject';

				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.Link,
				});
				break;

			case 'turnObject':
				menuId = 'typeSuggest';

				menuParam.data = Object.assign(menuParam.data, {
					filter: '',
					smartblockTypes: [ I.SmartBlockType.Page ],
					onClick: (item: any) => {
						menuParam.data.onSelect();

						this.moveToPage(item.id);
						close();
					},
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
		
		const { param, close } = this.props;
		const { data } = param;
		const { rootId, blockId, onSelect, blockCreate } = data;
		const { filter } = commonStore;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};

		keyboard.setFocus(false);

		let text = String(data.text || '');
		let length = text.length;
		let marks = data.marks || [];
		let position = length ? I.BlockPosition.Bottom : I.BlockPosition.Replace; 

		const onCommand = (blockId: string) => {
			const block = blockStore.getLeaf(rootId, blockId);

			if (block.isText()) {
				focus.set(blockId, { from: length, to: length });
				focus.apply();
			};
		};

		const cb = () => {
			if (item.isTextColor) {
				C.BlockTextListSetColor(rootId, [ blockId ], item.value, (message: any) => {
					onCommand(message.blockId || blockId);
					analytics.event('ChangeBlockColor', { color: item.value, count: 1 });
				});
			};

			if (item.isBgColor) {
				C.BlockListSetBackgroundColor(rootId, [ blockId ], item.value, (message: any) => {
					onCommand(message.blockId || blockId);
					analytics.event('ChangeBlockBackground', { color: item.value, count: 1 });
				});
			};

			if (item.isAlign) {
				C.BlockListSetAlign(rootId, [ blockId ], item.itemId, (message: any) => {
					onCommand(message.blockId || blockId);
					analytics.event('ChangeBlockAlign', { align: item.itemId, count: 1 });
				});
			};

			if (item.isAction) {
				switch (item.itemId) {
					case 'download':
						Action.download(block, 'menu');
						break;

					case 'copy':
						Action.duplicate(rootId, rootId, blockId, [ blockId ], I.BlockPosition.Bottom);
						break;
					
					case 'remove':
						Action.remove(rootId, blockId, [ blockId ]);
						break;
				};
			};

			if (item.isBlock) {
				let param: any = {
					type: item.type,
					bgColor: block.bgColor,
					hAlign: block.hAlign,
					vAlign: block.vAlign,
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
					position = I.BlockPosition.Top;
					param.content.style = item.itemId;
				};

				if (item.type == I.BlockType.Relation) {
					param.content.key = item.relationKey;
				};

				if (item.type == I.BlockType.Dataview) {
					param.content.isCollection = item.itemId == 'collection';
					param.content.views = [ 
						{ type: I.ViewType.Grid, name: 'All' } 
					];
				};

				if (item.type == I.BlockType.Table) {
					C.BlockTableCreate(rootId, blockId, position, Number(item.rowCnt) || 3, Number(item.columnCnt) || 3, false, (message: any) => {
						analytics.event('CreateBlock', { 
							middleTime: message.middleTime, 
							type: param.type, 
						});
					});
				} else
				if ((item.type == I.BlockType.Text) && (item.itemId != I.TextStyle.Code)) {
					C.BlockListTurnInto(rootId, [ blockId ], item.itemId, (message: any) => {
						onCommand(message.blockId || blockId);

						analytics.event('CreateBlock', { 
							middleTime: message.middleTime, 
							type: param.type, 
							style: param.content?.style,
						});
					});
				} else 
				if (item.isObject) {
					const details: any = { type: item.objectTypeId };

					if (item.objectTypeId == Constant.typeId.set) {
						details.layout = I.ObjectLayout.Set;
					};

					const create = (template: any) => {
						ObjectUtil.create(rootId, blockId, details, position, template?.id, DataUtil.defaultLinkSettings(), [], (message: any) => {
							if (message.error.code) {
								return;
							};

							ObjectUtil.openPopup({ ...details, id: message.targetId });

							analytics.event('CreateObject', {
								route: 'Powertool',
								objectType: item.objectTypeId,
								layout: template?.layout,
								template: (template && template.templateIsBundled ? template.id : 'custom'),
							});
						});
					};

					DataUtil.checkTemplateCnt([ item.objectTypeId ], (message: any) => {
						if (message.records.length > 1) {
							popupStore.open('template', {
								data: { 
									typeId: item.objectTypeId,
									onSelect: create,
								},
							});
						} else {
							create(message.records.length ? message.records[0] : '');
						};
					});
				} else {
					keyboard.setFocus(false);

					blockCreate(blockId, position, param, (newBlockId: string) => {
						// Auto-open BlockRelation suggest menu
						if ((param.type == I.BlockType.Relation) && !param.content.key) {
							window.setTimeout(() => { $(`#block-${newBlockId} .info`).trigger('click'); }, Constant.delay.menu);
						};

						// Auto-open BlockLatex edit mode
						if (param.type == I.BlockType.Latex) {
							window.setTimeout(() => { $(`#block-${newBlockId} #value`).trigger('click'); }, Constant.delay.menu);
						};

						if (param.type == I.BlockType.Dataview) {
							window.setTimeout(() => { $(window).trigger(`setDataviewSource.${newBlockId}`); }, Constant.delay.menu);
						};
					});
				};
			};

			close();
		};

		if (onSelect) {
			onSelect(e, item);
		};

		marks = Mark.adjust(marks, filter.from - 1, -1);

		// Hack to prevent onBlur save
		$(`#block-${blockId} #value`).first().text(text);
		DataUtil.blockSetText(rootId, block.id, text, marks, true, cb);
	};

	moveToPage (type: string) {
		const { param, dataset } = this.props;
		const { data } = param;
		const { blockId, rootId,  } = data;
		const { selection } = dataset || {};
		
		let ids = [];
		if (selection) {
			ids = selection.get(I.SelectType.Block);
		};
		if (!ids.length) {
			ids = [ blockId ];
		};

		C.BlockListConvertToObjects(rootId, ids, type);
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems(true);
		const obj = $(`#${getId()} .content`);
		
		let height = 16;
		for (let i = 0; i < items.length; ++i) {
			height += this.getRowHeight(items[i], i);
		};
		height = Math.max(HEIGHT_ITEM + 18, Math.min(360, height));

		obj.css({ height: height });
		position();
	};

	getRowHeight (item: any, index: number) {
		if (item.isRelation || item.isRelationAdd) {
			return HEIGHT_RELATION;
		};
		if (item.isSection && index > 0) {
			return HEIGHT_SECTION;
		};
		if (item.isBlock) {
			return HEIGHT_DESCRIPTION;
		};
		return HEIGHT_ITEM;
	};

	recalcIndex () {
		const itemsWithSection = this.getItems(true);
		const itemsWithoutSection = itemsWithSection.filter((it: any) => { return !it.isSection; });
		const active: any = itemsWithoutSection[this.n] || {};

		return itemsWithSection.findIndex((it: any) => { return it.id == active.id; });
	};

});

export default MenuBlockAdd;