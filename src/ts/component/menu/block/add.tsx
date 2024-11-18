import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { MenuItemVertical, Icon, Cell } from 'Component';
import { I, C, S, U, J, Mark, keyboard, focus, Action, Storage, translate, analytics, Relation } from 'Lib';

const HEIGHT_ITEM = 32;
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
	n = 0;
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
		const { filter } = S.Common;
		const items = this.getItems(true);
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
			if (item.isSection) {
				content = <div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={param.style}>{item.name}</div>;
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
								menuClassName="fromBlock"
								pageContainer={U.Common.getCellContainer('menuBlockAdd')}
								readonly={true}
								canOpen={false}
								placeholder={translate('placeholderCellCommon')}
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
					item.object = { 
						name: item.name,
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
							threshold={LIMIT}
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
			keyMapper: i => (items[i] || {}).id,
		});
		
		$(`#${getId()}`).off('mouseleave').on('mouseleave', () => window.clearTimeout(this.timeout));
	};
	
	componentDidUpdate () {
		const { filter } = S.Common;
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
			keyMapper: i => (items[i] || {}).id,
		});

		if (this.filter != filter.text) {
			this.n = 0;
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

	getRelations () {
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const { config } = S.Common;
		const object = S.Detail.get(rootId, rootId, [ 'targetObjectType' ]);
		const isTemplate = U.Object.isTemplate(object.type);
		const type = S.Record.getTypeById(isTemplate ? object.targetObjectType : object.type);

		const relations = S.Record.getObjectRelations(rootId, rootId);
		const relationKeys = relations.map(it => it.relationKey);
		const typeRelations = (type ? type.recommendedRelations || [] : []).
			map(it => S.Record.getRelationById(it)).
			filter(it => it && it.relationKey && !relationKeys.includes(it.relationKey));

		const ret = relations.concat(typeRelations).filter(it => !config.debug.hiddenObject && it.isHidden ? false : it.isInstalled).sort(U.Data.sortByName);

		ret.unshift({ id: 'add', name: translate('menuBlockAddNewRelation'), isRelationAdd: true });

		return ret.map(it => ({ ...it, type: I.BlockType.Relation, isRelation: true, isBlock: true }));
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

		let sections: any[] = [
			{ id: 'text', name: translate('menuBlockAddSectionsText'), children: U.Menu.getBlockText() },
			{ id: 'list', name: translate('menuBlockAddSectionsList'), children: U.Menu.getBlockList() },
			{ id: 'media', name: translate('menuBlockAddSectionsMedia'), children: U.Menu.getBlockMedia() },
			{ id: 'embed', name: translate('menuBlockAddSectionsEmbed'), children: U.Menu.getBlockEmbed() },
			{ id: 'other', name: translate('menuBlockAddSectionsOther'), children: U.Menu.getBlockOther() },
			{ id: 'object', name: translate('menuBlockAddSectionsObjects'), children: U.Menu.getBlockObject() },
		].map(s => ({ ...s, children: s.children.map(c => ({ ...c, isBig: true })) }));

		sections = sections.concat([
			{ id: 'relation', name: translate('menuBlockAddSectionsRelations'), children: this.getRelations() },
		]);
		
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
				sections.push({ id: 'color', icon: 'color', name: translate('menuBlockAddSectionsTextColor'), color: '', children: U.Menu.getTextColors() });
			};
			if (block.canHaveBackground()) {
				sections.push({ id: 'bgColor', icon: 'bgColor', name: translate('menuBlockAddSectionsBackgroundColor'), color: '', children: U.Menu.getBgColors() });
			};
			
			sections = U.Menu.sectionsFilter(sections, filter.text);
		};
		
		return U.Menu.sectionsMap(sections);
	};
	
	getItems (withSections: boolean) {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (const section of sections) {
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
			S.Menu.closeAll(J.Menu.add);
			return;
		};

		const { param, getId, getSize, close } = this.props;
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

		let menuId = '';
		const menuParam: I.MenuParam = {
			menuKey: item.itemId,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			data: {
				rebind: this.rebind,
				rootId,
				skipIds: [ rootId ],
				blockId,
				blockIds: [ blockId ],
				position,
				onSelect: () => {
					$(`#block-${blockId} .value`).text(text);

					U.Data.blockSetText(rootId, block.id, text, block.content.marks, true, () => {
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
					filters: [
						{ relationKey: 'layout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
					],
				});
				break;

			case 'existingPage':
				menuId = 'searchObject';
				menuParam.data.canAdd = true;
				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.Link,
				});
				break;

			case 'existingFile':
				menuId = 'searchObject';
				menuParam.data.canAdd = true;
				menuParam.data = Object.assign(menuParam.data, {
					type: I.NavigationType.Link,
					filters: [
						{ relationKey: 'layout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() },
					],
				});
				break;

			case 'turnObject':
				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
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

		if (menuId && !S.Menu.isOpen(menuId, item.itemId)) {
			S.Menu.closeAll(J.Menu.add, () => {
				S.Menu.open(menuId, menuParam);
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

		let marks = data.marks || [];
		let position = length ? I.BlockPosition.Bottom : I.BlockPosition.Replace; 

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
				};
			};

			if (item.isBlock) {
				const param: any = {
					type: item.type,
					bgColor: block.bgColor,
					hAlign: block.hAlign,
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
						{ type: I.ViewType.Grid, name: translate('commonAll') }
					];
				};

				if (item.type == I.BlockType.Embed) {
					param.content.processor = item.itemId;
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
						const element = $(`#block-${newBlockId}`);

						window.setTimeout(() => { 
							// Auto-open BlockRelation suggest menu
							if ((param.type == I.BlockType.Relation) && !param.content.key) {
								element.find(`.info`).trigger('click');
							};

							// Auto-open BlockEmbed edit mode
							if (param.type == I.BlockType.Embed) {
								element.find(`.focusable`).trigger('edit');
							};

							if (param.type == I.BlockType.Dataview) {
								win.trigger(`setDataviewSource.${newBlockId}`);
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
		const itemsWithoutSection = itemsWithSection.filter(it => !it.isSection);
		const active: any = itemsWithoutSection[this.n] || {};

		return itemsWithSection.findIndex(it => it.id == active.id);
	};

});

export default MenuBlockAdd;
