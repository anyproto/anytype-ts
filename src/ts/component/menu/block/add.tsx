import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { MenuItemVertical, Icon, Cell } from 'Component';
import { I, C, S, U, J, M, Mark, keyboard, focus, Action, Storage, translate, analytics, Relation } from 'Lib';

const HEIGHT_ITEM = 32;
const HEIGHT_SECTION = 42;
const HEIGHT_DESCRIPTION = 56;
const LIMIT = 10;

interface State {
	items: any[];
};

const MenuBlockAdd = observer(class MenuBlockAdd extends React.Component<I.Menu, State> {
	
	emptyLength = 0;
	timeout = 0;
	cache: any = {};
	refList: any = null;
	n = 0;
	filter = '';
	state = {
		items: [],
	};
	
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
		const { filter } = S.Common;
		const items = this.getItems();
		const block = S.Block.getLeaf(rootId, blockId);
		const idPrefix = 'menuBlockAdd';

		const rowRenderer = (param: any) => {
			const { index } = param;
			const item: any = items[index];
			
			let content = null;
			if (item.isRelationAdd) {
				content = (
					<div 
						id="item-relation-add" 
						className="item add" 
						onClick={e => this.onClick(e, item)} 
						onMouseEnter={e => this.onMouseEnter(e, item)} 
						style={param.style}
					>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else 
			if (item.isRelation) {
				content = (
					<div 
						id={'item-' + item.id}
						className={[ 'item', 'sides', (item.isHidden ? 'isHidden' : '') ].join(' ')} 
						onMouseEnter={e => this.onMouseEnter(e, item)} 
						onClick={e => this.onClick(e, item)} 
						style={param.style}
					>
						<div className="info">
							{item.name}
						</div>
						<div
							id={Relation.cellId(idPrefix, item.relationKey, rootId)} 
							className={[ 'cell', Relation.className(item.format) ].join(' ')} 
						>
							<Cell 
								rootId={rootId}
								subId={rootId}
								block={block}
								relationKey={item.relationKey}
								getRecord={() => S.Detail.get(rootId, rootId, [ item.relationKey ])}
								viewType={I.ViewType.Grid}
								idPrefix={idPrefix}
								pageContainer={U.Common.getCellContainer('menuBlockAdd')}
								readonly={true}
								canOpen={false}
								placeholder={translate('placeholderCellCommon')}
								menuParam={{ classNameWrap: 'fromBlock' }}
							/>
						</div>
					</div>
				);
			} else {
				const cn = [];
				const icn: string[] = [ 'inner' ];
					
				if (item.isTextColor) {
					icn.push('textColor textColor-' + (item.value || 'default'));
				};
				if (item.isBgColor) {
					icn.push('bgColor bgColor-' + (item.value || 'default'));
				};
				
				if (item.isTextColor || item.isBgColor) {
					item.icon = 'color';
					item.inner = <div className={icn.join(' ')} />;
				};

				if (item.isBig) {
					cn.push('isBig');
				};

				if (item.isHidden) {
					cn.push('isHidden');
				};

				if (item.isObject) {
					item.object = { ...item, layout: I.ObjectLayout.Type };
					item.iconSize = 40;
				};
				
				content = (
					<MenuItemVertical 
						key={item.id + '-' + index} 
						{...item} 
						index={index}
						className={cn.join(' ')}
						withDescription={item.withDescription} 
						onMouseEnter={e => this.onMouseEnter(e, item)} 
						onClick={e => this.onClick(e, item)} 
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
						>
							{({ onRowsRendered }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={ref => this.refList = ref}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={({ index }) => this.getRowHeight(items[index], index)}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={LIMIT}
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
		const items = this.getItems();
		
		this.rebind();
		this.checkFilter();
		this.resize();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: i => this.getRowHeight(items[i], i),
			keyMapper: i => (items[i] || {}).id,
		});
		
		$(`#${getId()}`).off('mouseleave').on('mouseleave', () => window.clearTimeout(this.timeout));
	};
	
	componentDidUpdate () {
		const { filter } = S.Common;
		const items = this.getItems();
		const itemsWithoutSections = items.filter(it => !it.isSection);

		if (!itemsWithoutSections.length && !this.emptyLength) {
			this.emptyLength = filter.text.length;
		};

		if ((filter.text.length - this.emptyLength > 3) && !items.length) {
			this.props.close();
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: i => this.getRowHeight(items[i], i),
			keyMapper: i => (items[i] || {}).id,
		});

		if (this.filter != filter.text) {
			this.n = 0;
			this.filter = filter.text;
			this.loadObjects();
			return;
		};

		this.checkFilter();
		this.resize();
		this.props.setActive();
	};

	componentWillUnmount () {
		S.Menu.closeAll(J.Menu.add);
	};

	checkFilter () {
		const { getId } = this.props;
		const { filter } = S.Common;

		$(`#${getId()}`).toggleClass('withFilter', !!filter);
	};
	
	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	loadObjects () {
		const filter = S.Common.filterText;

		if (!filter) {
			this.setState({ items: [] });
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;

		const filters: I.Filter[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getFileAndSystemLayouts().filter(it => !U.Object.isTypeLayout(it)) },
			{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template ] },
			{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template, J.Constant.typeKey.type ] },
			{ relationKey: 'id', condition: I.FilterCondition.NotEqual, value: rootId },
		];
		const sorts: I.Sort[] = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			{ relationKey: 'type', type: I.SortType.Asc },
		];

		U.Subscription.search({
			filters,
			sorts,
			fullText: filter,
			limit: J.Constant.limit.menuRecords,
		}, (message: any) => {
			this.setState({ items: message.records || [] });
		});
	};

	getRelations () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const object = S.Detail.get(rootId, rootId);
		const isTemplate = U.Object.isTemplateType(object.type);
		const objectKeys = S.Detail.getKeys(rootId, rootId);
		const objectRelations = objectKeys.map(it => S.Record.getRelationByKey(it)).filter(it => it);
		const typeIds = U.Object.getTypeRelationIds(isTemplate ? object.targetObjectType : object.type);
		const typeRelations = typeIds.map(it => S.Record.getRelationById(it)).filter(it => it);
		
		let ret = [].concat(typeRelations);

		if (!isTemplate) {
			ret = ret.concat(objectRelations);
		};

		ret = S.Record.checkHiddenObjects(ret).sort(U.Data.sortByName);

		if (!isTemplate) {
			ret.unshift({ id: 'add', name: translate('menuBlockAddNewRelation'), isRelationAdd: true, _sortWeight_: 1000 });
		};

		return ret.map(it => ({ ...it, type: I.BlockType.Relation, isRelation: true, isBlock: true, aliases: [ 'relation' ] }));
	};
	
	getSections () {
		const { param } = this.props;
		const { filter } = S.Common;
		const { data } = param;
		const { blockId, rootId } = data;
		const block = S.Block.getLeaf(rootId, blockId);
		
		if (!block) {
			return [];
		};

		const items = (this.state.items || []).map((it: any) => {
			return { 
				...it, 
				object: { ...it }, 
				isBlock: true, 
				type: I.BlockType.Link,
			};
		});

		let sections: any[] = [
			{ id: 'text', name: translate('menuBlockAddSectionText'), children: U.Menu.getBlockText(), isBig: true, withDescription: true },
			{ id: 'list', name: translate('menuBlockAddSectionList'), children: U.Menu.getBlockList(), isBig: true, withDescription: true },
			{ id: 'link', name: translate('menuBlockAddSectionLink'), children: U.Menu.getBlockLink(), isBig: true, withDescription: true },
			{ id: 'media', name: translate('menuBlockAddSectionMedia'), children: U.Menu.getBlockMedia(), isBig: true, withDescription: true },
			{ id: 'other', name: translate('menuBlockAddSectionOther'), children: U.Menu.getBlockOther(), isBig: true, withDescription: true },
			{ id: 'type', name: translate('menuBlockAddSectionType'), children: U.Menu.getBlockObject(), isBig: true, withDescription: true },
			{ id: 'relation', name: translate('menuBlockAddSectionRelations'), children: this.getRelations(), isBig: false, withDescription: false },
			{ id: 'object', name: translate('menuBlockAddSectionObject'), children: items, isBig: false, withDescription: false },
			{ id: 'embed', name: translate('menuBlockAddSectionEmbed'), children: U.Menu.getBlockEmbed(), isBig: false, withDescription: false },
		].map(s => ({ 
			...s, 
			children: s.children.map(c => ({
				...s,
				...c, 
			})),
		}));
		
		if (filter && filter.text) {
			const actions = U.Menu.getActions({ count: 1 });

			if (block.canTurnPage()) {
				actions.push({ id: 'turnObject', icon: 'object', name: translate('commonTurnIntoObject'), arrow: true });
			};

			sections = sections.concat([
				{ id: 'action', icon: 'action', name: translate('commonActions'), color: '', children: actions },
			]);

			if (block.canHaveAlign()) {
				const restricted = [];
				if (!block.isText()) {
					restricted.push(I.BlockHAlign.Justify);
				};
				if (block.isTextQuote()) {
					restricted.push(I.BlockHAlign.Center);
				};

				sections.push({ id: 'align', icon: 'align', name: translate('commonAlign'), color: '', children: U.Menu.getHAlign(restricted) });
			};
			if (block.canHaveColor()) {
				sections.push({ id: 'color', icon: 'color', name: translate('menuBlockAddSectionTextColor'), color: '', children: U.Menu.getTextColors() });
			};
			if (block.canHaveBackground()) {
				sections.push({ id: 'bgColor', icon: 'bgColor', name: translate('menuBlockAddSectionBackgroundColor'), color: '', children: U.Menu.getBgColors() });
			};
			
			sections = U.Menu.sectionsFilter(sections, filter.text);
		};

		return U.Menu.sectionsMap(sections);
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (const section of sections) {
			if (section.name) {
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

	getMenuParam () {
		const { id, param, getSize } = this.props;
		const { data, className, classNameWrap } = param;
		const { rootId, blockId } = data;

		return {
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			className,
			classNameWrap,
			rebind: this.rebind,
			parentId: id,
			data: {
				rootId,
				skipIds: [ rootId ],
				blockId,
				blockIds: [ blockId ],
			},
		};
	};
	
	onOver (e: any, item: any) {
		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.add);
			return;
		};

		const { param, getId, close } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;
		const { filter } = S.Common;
		const block = S.Block.getLeaf(rootId, blockId);
		const text = U.Common.stringCut(data.text, filter.from - 1, filter.from + filter.text.length);
		const length = text.length;
		const position = length ? I.BlockPosition.Bottom : I.BlockPosition.Replace;

		if (!block) {
			return;
		};

		const menuParam: I.MenuParam = Object.assign(this.getMenuParam(), {
			menuKey: item.itemId,
			isSub: true,
			element: `#${getId()} #item-${item.id}`,
		});

		menuParam.data = Object.assign(menuParam.data, {
			position,
			onSelect: () => {
				$(`#block-${blockId} .value`).text(text);

				U.Data.blockSetText(rootId, block.id, text, block.content.marks, true, () => {
					focus.set(blockId, { from: length, to: length });
					focus.apply();
				});

				close();
			},
		});

		let menuId = '';

		switch (item.itemId) {	
			case 'move': {
				menuId = 'searchObject';
				menuParam.offsetY = -36;

				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.Move, 
					filters: [
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
					],
				});
				break;
			};

			case 'turnObject': {
				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
					canAdd: true,
					filter: '',
					filters: [
						{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
					],
					onClick: (item: any) => {
						menuParam.data.onSelect();

						this.moveToPage(item.id);
						close();
					},
				});
				break;
			};

		};

		if (menuId && !S.Menu.isOpen(menuId, item.itemId)) {
			S.Menu.closeAll(J.Menu.add, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};
	
	onClick (e: any, item: any) {
		e.stopPropagation();

		if (item.arrow && !item.skipOver) {
			return;
		};
		
		const { param, close, getId } = this.props;
		const { data } = param;
		const { rootId, blockId, onSelect, blockCreate } = data;
		const block = S.Block.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};

		keyboard.setFocus(false);

		const win = $(window);
		const { filter } = S.Common;
		const text = String(data.text || '');
		const length = text.length;
		const onCommand = (blockId: string) => {
			const block = S.Block.getLeaf(rootId, blockId);

			if (block && block.isText()) {
				focus.set(blockId, { from: length, to: length });
				focus.apply();
			};
		};

		let menuId = '';
		let marks = data.marks || [];
		let position = length ? I.BlockPosition.Bottom : I.BlockPosition.Replace; 

		const rect = $(`#${getId()}`).get(0).getBoundingClientRect();
		const menuParam: I.MenuParam = Object.assign(this.getMenuParam(), {
			menuKey: item.itemId,
			rect,
			offsetX: 0,
		});

		menuParam.data = Object.assign(menuParam.data, {
			position,
			onSelect: () => {
				$(`#block-${blockId} .value`).text(text);

				U.Data.blockSetText(rootId, block.id, text, block.content.marks, true, () => {
					focus.set(blockId, { from: length, to: length });
					focus.apply();
				});

				close();
			},
		});

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
						Action.downloadFile(block.getTargetObjectId(), analytics.route.menuAdd, block.isFileImage());
						break;

					case 'copy':
						Action.duplicate(rootId, rootId, blockId, [ blockId ], I.BlockPosition.Bottom);
						break;
					
					case 'remove':
						Action.remove(rootId, blockId, [ blockId ]);
						break;

					case 'date': {
						menuId = 'calendar';
						menuParam.data = Object.assign(menuParam.data, {
							canEdit: true,
							value: U.Date.now(),
							onChange: (t: number) => {
								C.ObjectDateByTimestamp(S.Common.space, t, (message: any) => {
									if (message.error.code) {
										return;
									};

									const target = message.details;

									C.BlockCreate(rootId, blockId, position, U.Data.getLinkBlockParam(target.id, target.layout, true), (message: any) => {
										if (message.error.code) {
											return;
										};

										focus.set(message.blockId, { from: 0, to: 0 });
										focus.apply();

										analytics.event('CreateLink');
										close();
									});
								});
							}
						});
						break;
					};

					case 'existingPage': {
						menuId = 'searchObject';
						menuParam.data = Object.assign(menuParam.data, {
							canAdd: true,
							type: I.NavigationType.Link,
							withPlural: true,
							filters: [
								{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getFileLayouts() },
							],
						});
						break;
					};

					case 'existingFile': {
						menuId = 'searchObject';
						menuParam.data = Object.assign(menuParam.data, {
							canAdd: true,
							type: I.NavigationType.Link,
							filters: [
								{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() },
							],
						});
						break;
					};
				};
			};

			if (menuId && !S.Menu.isOpen(menuId, item.itemId)) {
				close(() => {
					window.setTimeout(() => S.Menu.open(menuId, menuParam), S.Menu.getTimeout());
				});
			} else
			if (item.isBlock) {
				let param: any = {
					type: item.type,
					vAlign: block.vAlign,
					content: {},
				};

				if (item.type == I.BlockType.Text) {
					param.content.style = item.itemId;

					if (param.content.style == I.TextStyle.Code) {
						param.hAlign = I.BlockHAlign.Left;
						param.fields = { 
							lang: (Storage.get('codeLang') || J.Constant.default.codeLang),
						};
					};

					if (param.content.style == I.TextStyle.Callout) {
						const icon = Storage.get('calloutIcon');
						if (icon) {
							param.content.iconEmoji = icon;	
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
						{ type: I.ViewType.List, name: translate('commonAll') }
					];
				};

				if (item.type == I.BlockType.Embed) {
					param.content.processor = item.itemId;
				};

				if (item.type == I.BlockType.Link) {
					param = U.Data.getLinkBlockParam(item.itemId, item.layout, true);
				};

				const newBlock = new M.Block(param);
				if (newBlock.canHaveAlign()) {
					const restricted = [];

					if (!newBlock.isText()) {
						restricted.push(I.BlockHAlign.Justify);
					};
					if (newBlock.isTextQuote()) {
						restricted.push(I.BlockHAlign.Center);
					};
					if (!restricted.includes(block.hAlign)) {
						param.hAlign = block.hAlign;
					};
				};

				if (newBlock.canHaveBackground()) {
					param.bgColor = block.bgColor;
				};

				if (item.type == I.BlockType.Table) {
					C.BlockTableCreate(rootId, blockId, position, Number(item.rowCnt) || 3, Number(item.columnCnt) || 3, false, (message: any) => {
						if (message.error.code) {
							return;
						};

						const { rows, columns } = S.Block.getTableData(rootId, message.blockId);
						if (!rows.length || !columns.length) {
							return;
						};

						C.BlockTableRowListFill(rootId, [ rows[0].id ], () => {
							const cellId = [ rows[0].id, columns[0].id ].join('-');

							focus.set(cellId, { from: 0, to: 0 });
							focus.apply();
						});

						analytics.event('CreateBlock', { middleTime: message.middleTime, type: param.type });
					});
				} else
				if ((item.type == I.BlockType.Text) && ![ I.TextStyle.Code, I.TextStyle.Callout ].includes(item.itemId)) {
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
					const type = S.Record.getTypeById(item.objectTypeId) || {};
					const details: any = { type: type.id };

					if (U.Object.isInSetLayouts(type.recommendedLayout)) {
						details.layout = type.recommendedLayout;
					};

					U.Object.create(rootId, blockId, details, position, type.defaultTemplateId, [ I.ObjectFlag.SelectTemplate ], analytics.route.powertool, (message: any) => {
						U.Object.openConfig(message.details);
						analytics.event('CreateLink');
					});
				} else {
					keyboard.setFocus(false);

					blockCreate(blockId, position, param, (newBlockId: string) => {
						window.setTimeout(() => { 
							const element = $(`#block-${newBlockId}`);

							// Auto-open BlockRelation suggest menu
							if ((param.type == I.BlockType.Relation) && !param.content.key) {
								element.find(`.info`).trigger('click');
							};

							// Auto-open BlockEmbed edit mode
							if (param.type == I.BlockType.Embed) {
								element.find(`.focusable`).trigger('edit');
							};

							// Auto-open BlockDataview source menu
							if (param.type == I.BlockType.Dataview) {
								win.trigger(`setDataviewSource.${newBlockId}`);
							};

							// Auto-open BlockFile upload dialog
							if (param.type == I.BlockType.File) {
								element.find(`.fileWrap`).trigger('mousedown');
							};

							// Auto-focus bookmark input field
							if (param.type == I.BlockType.Bookmark) {
								element.find('.urlToggle').trigger('click');
							};
						}, S.Menu.getTimeout());
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
		U.Data.blockSetText(rootId, blockId, text, marks, true, cb);
	};

	moveToPage (typeId: string) {
		const { param } = this.props;
		const { data } = param;
		const { blockId, rootId } = data;
		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.get(I.SelectType.Block) || [];

		if (!ids.length) {
			ids.push(blockId);
		};
		
		U.Data.moveToPage(rootId, ids, typeId, analytics.route.powertool);
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems().slice(0, LIMIT);
		const obj = $(`#${getId()} .content`);
		
		let height = 16;
		for (let i = 0; i < items.length; ++i) {
			height += this.getRowHeight(items[i], i);
		};
		height = Math.max(HEIGHT_ITEM + 18, height);

		obj.css({ height });
		position();
	};

	getRowHeight (item: any, index: number) {
		let h = HEIGHT_ITEM;
		if (item.isSection && (index > 0)) {
			h = HEIGHT_SECTION;
		} else 
		if (item.withDescription) {
			h = HEIGHT_DESCRIPTION;
		};
		return h;
	};

	scrollToRow (items: any[], index: number) {
		if (!this.refList || !items.length) {
			return;
		};

		const listHeight = this.refList.props.height;
		const itemHeight = this.getRowHeight(items[index], index);

		let offset = 0;
		let total = 0;

		for (let i = 0; i < items.length; ++i) {
			const h = this.getRowHeight(items[i], i);

			if (i < index) {
				offset += h;
			};
			total += h;
		};

		if (offset + itemHeight < listHeight) {
			offset = 0;
		} else {
			offset -= listHeight / 2 - itemHeight / 2;
		};

		offset = Math.min(offset, total - listHeight + 16);
		this.refList.scrollToPosition(offset);
	};

});

export default MenuBlockAdd;
