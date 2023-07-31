import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Cell } from 'Component';
import { I, C, UtilData, UtilCommon, UtilObject, Preview, focus, analytics, Relation, translate, Onboarding, history as historyPopup, keyboard } from 'Lib';
import { blockStore, detailStore, dbStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.BlockComponent {
	iconSize?: number;
};

const PREFIX = 'blockFeatured';
const SOURCE_LIMIT = 1;

const BlockFeatured = observer(class BlockFeatured extends React.Component<Props> {

	_isMounted = false;
	cellRefs: Map<string, any> = new Map();
	menuContext: any = null;
	setId = '';
	node = null;

	public static defaultProps = {
		iconSize: 24,
	};

	constructor (props: Props) {
		super(props);

		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onType = this.onType.bind(this);
		this.onTypeOver = this.onTypeOver.bind(this);
		this.onTypeSelect = this.onTypeSelect.bind(this);
		this.onSource = this.onSource.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.onRelation = this.onRelation.bind(this);
		this.elementMapper = this.elementMapper.bind(this);
	};

	render () {
		const { rootId, block, iconSize, isPopup, readonly } = this.props;
		const storeId = this.getStoreId();
		const short = detailStore.get(rootId, storeId, [ 'featuredRelations' ], true);
		const featuredRelations = Relation.getArrayValue(short.featuredRelations);
		const object = detailStore.get(rootId, storeId, featuredRelations);
		const type = detailStore.get(rootId, object.type, [ 'name', 'isDeleted' ]);
		const allowedValue = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const items = this.getItems();
		const bullet = <div className="bullet" />;
		const typeName = (
			<div className="name">
				{type && !type.isDeleted && !type._empty_ ? UtilCommon.shorten(type.name, 32) : (
					<span className="textColor-red">
						{translate('commonDeletedType')}
					</span>
				)}
			</div>
		);

		let typeRelation = null;

		if (UtilObject.isTemplate(object.type)) {
			typeRelation = (
				<span className="cell">
					<div className="cellContent type disabled">
						{typeName}
					</div>
				</span>
			);
		} else
		if (featuredRelations.includes('type')) {
			typeRelation = (
				<span className="cell canEdit">
					<div
						id={Relation.cellId(PREFIX, 'type', object.id)}
						className="cellContent type"
						onClick={this.onType}
						onMouseEnter={(e: any) => { this.onMouseEnter(e, 'type'); }}
						onMouseLeave={this.onMouseLeave}
					>
						{typeName}
					</div>
				</span>
			);
		};

		let types = Relation.getSetOfObjects(rootId, storeId, Constant.typeId.type).map(it => it.name);
		let relations = Relation.getSetOfObjects(rootId, storeId, Constant.typeId.relation).map(it => it.name);
		let setOfString = [];
		let tl = types.length;
		let rl = relations.length;

		if (tl) {
			const pluralType = UtilCommon.plural(tl, translate('pluralType'));
			types = types.slice(0, SOURCE_LIMIT);
			setOfString.push(UtilCommon.sprintf(translate('blockFeaturedTypesList'), pluralType, types.join(', ')));

			if (tl > SOURCE_LIMIT) {
				setOfString.push(<div className="more">+{tl - SOURCE_LIMIT}</div>);
			};
		};
		if (rl) {
			relations = relations.slice(0, SOURCE_LIMIT);
			setOfString.push(`${UtilCommon.plural(rl, translate('pluralUCRelation'))}: ${relations.join(', ')}`);

			if (rl > SOURCE_LIMIT) {
				setOfString.push(<div className="more">+{rl - SOURCE_LIMIT}</div>);
			};
		};

		return (
			<div 
				ref={node => this.node = node}
				className={[ 'wrap', 'focusable', 'c' + block.id ].join(' ')} 
				tabIndex={0} 
				onKeyDown={this.onKeyDown} 
				onKeyUp={this.onKeyUp}
			>
				<span id="onboardingAnchor" />

				{typeRelation}

				{featuredRelations.includes('setOf') ? (
					<span className={[ 'cell', (!readonly ? 'canEdit' : '') ].join(' ')}>
						{bullet}
						<div
							id={Relation.cellId(PREFIX, 'setOf', object.id)}
							className="cellContent setOf"
							onClick={this.onSource}
							onMouseEnter={(e: any) => { this.onMouseEnter(e, 'setOf', 'Query'); }}
							onMouseLeave={this.onMouseLeave}
						>
							{setOfString.length ? (
								<div className="name">
									{setOfString.map((it: any, i: number) => (
										<div className="element" key={i}>{it}</div>
									))}
								</div>
							) : (
								<div className="empty">{translate('blockFeaturedQuery')}</div>
							)}
						</div>
					</span>
				) : ''}

				{items.map((relationKey: any, i: any) => {
					const id = Relation.cellId(PREFIX + block.id, relationKey, object.id);
					const relation = dbStore.getRelationByKey(relationKey);
					const canEdit = allowedValue && !relation.isReadonlyValue;
					const cn = [ 'cell', (canEdit ? 'canEdit' : '') ];
					const check = Relation.checkRelationValue(relation, object[relationKey]);

					if (!check && !canEdit) {
						return null;
					};

					if (i == items.length - 1) {
						cn.push('last');
					};

					return (
						<span
							key={i}
							className={cn.join(' ')}
							onClick={(e: any) => {
								e.persist();
								this.onRelation(e, relationKey);
							}}
						>
							{bullet}
							<Cell
								ref={ref => this.cellRefs.set(id, ref)}
								elementId={id}
								rootId={rootId}
								subId={rootId}
								block={block}
								relationKey={relationKey}
								getRecord={() => object}
								recordId={object.id}
								viewType={I.ViewType.Grid}
								bodyContainer={UtilCommon.getBodyContainer(isPopup ? 'popup' : 'page')}
								pageContainer={UtilCommon.getCellContainer(isPopup ? 'popup' : 'page')}
								iconSize={iconSize}
								readonly={!canEdit}
								isInline={true}
								idPrefix={PREFIX + block.id}
								elementMapper={this.elementMapper}
								showTooltip={true}
								tooltipX={I.MenuDirection.Left}
								arrayLimit={2}
								textLimit={150}
								onMouseLeave={this.onMouseLeave}
							/>
						</span>
					);
				})}
			</div>
		);
	};

	componentDidMount () {
		const { isInsidePreview } = this.props;
		this._isMounted = true;

		if (!isInsidePreview) {
			window.setTimeout(() => {
				this.checkType();
				this.checkSource();
			}, Constant.delay.menu);
		};

		this.init();
	};

	componentDidUpdate (): void {
		this.init();
	};

	init () {
		const { rootId, block } = this.props;
		const storeId = this.getStoreId();
		const short = detailStore.get(rootId, storeId, [ 'featuredRelations' ], true);
		const featuredRelations = Relation.getArrayValue(short.featuredRelations).filter(it => it != 'description');
		const node = $(this.node);
		const obj = $(`#block-${block.id}`);

		featuredRelations.length ? obj.removeClass('isHidden') : obj.addClass('isHidden');

		if (node) {
			node.find('.cell.first').removeClass('first');
			node.find('.cell').first().addClass('first');
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	checkType () {
		const { rootId, isPopup } = this.props;
		const storeId = this.getStoreId();
		const object = detailStore.get(rootId, storeId, [ 'type' ], true);
		const type = detailStore.get(rootId, object.type, [ 'isDeleted' ], true);

		if (type.isDeleted) {
			Onboarding.start('typeDeleted', isPopup);
		};
	};

	checkSource () {
		const { rootId, isPopup } = this.props;
		const storeId = this.getStoreId();
		const object = detailStore.get(rootId, storeId, [ 'layout', 'setOf' ]);

		if (!object || object._empty_ || (object.layout != I.ObjectLayout.Set)) {
			return;
		};

		const setOf = Relation.getArrayValue(object.setOf);
		const types = Relation.getSetOfObjects(rootId, rootId, Constant.typeId.type);
		const relations = Relation.getSetOfObjects(rootId, rootId, Constant.typeId.relation);

		if (!setOf.length) {
			this.onSource();
		} else
		if (setOf.length && (setOf.length > (types.length + relations.length))) {
			Onboarding.start('sourceDeleted', isPopup, true);
		};
	};

	getItems () {
		const { rootId } = this.props;
		const storeId = this.getStoreId();
		const object = detailStore.get(rootId, storeId, [ 'featuredRelations' ], true);
		const skipIds = [
			'type',
			'description',
			'setOf',
		];

		return (object.featuredRelations || []).filter(it => dbStore.getRelationByKey(it) && !skipIds.includes(it));
	};

	onFocus () {
		const { block } = this.props;
		focus.set(block.id, { from: 0, to: 0 });
	};

	onKeyDown (e: any) {
		const { onKeyDown } = this.props;

		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};

	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};

	onCellClick (e: any, relationKey: string, recordId: string) {
		const relation = dbStore.getRelationByKey(relationKey);

		if (!relation || relation.isReadonlyValue) {
			return;
		};

		const id = Relation.cellId(PREFIX, relationKey, recordId);
		const ref = this.cellRefs.get(id);

		if (ref) {
			ref.onClick(e);
		};
	};

	onMouseEnter (e: any, relationKey: string, text?: string) {
		const { rootId } = this.props;
		const cell = $(`#${Relation.cellId(PREFIX, relationKey, rootId)}`);
		const relation = dbStore.getRelationByKey(relationKey);
		const show = (text: string) => {
			Preview.tooltipShow({ text, element: cell });
		};

		if (text) {
			show(text);
		} else 
		if (relation) {
			show(relation.name);
		};
	};

	onMouseLeave (e: any) {
		Preview.tooltipHide(false);
	};

	onType (e: any) {
		e.persist();
		e.preventDefault();
		e.stopPropagation();

		const { rootId, block, readonly } = this.props;
		const object = detailStore.get(rootId, rootId, [ 'setOf' ]);
		const type = detailStore.get(rootId, object.type, []);
		const allowed = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Type ]);
		const typeIsDeleted = type._empty_ || type.isDeleted
		const options: any[] = [];

		if (!type.isArchived && !typeIsDeleted) {
			options.push({ id: 'open', name: translate('blockFeaturedTypeMenuOpenType') });
		};

		if (!readonly && allowed) {
			options.push({ id: 'change', name: translate('blockFeaturedTypeMenuChangeType'), arrow: true });
		};

		if (!typeIsDeleted && (object.type === Constant.typeId.set)) {
			options.push({ id: 'turnCollection', name: translate('blockFeaturedTypeMenuTurnSetIntoCollection') });
		};

		const showMenu = () => {
			menuStore.open('select', {
				element: `#block-${block.id} #${Relation.cellId(PREFIX, 'type', rootId)}`,
				offsetY: 8,
				subIds: Constant.menuIds.featuredType,
				onOpen: (context: any) => {
					this.menuContext = context;
				},
				data: {
					options: options,
					noClose: true,
					onOver: this.onTypeOver,
					onSelect: (e: any, item: any) => {
						this.onTypeSelect(e, item);
					},
				},
			});
		};

		if (typeIsDeleted) {
			showMenu();
		} else {
			UtilData.checkSetCnt([ object.type ], (message: any) => {
				if (message.records.length == 1) {
					this.setId = message.records[0].id;
					options.push({ id: 'setOpen', name: UtilCommon.sprintf(translate('blockFeaturedTypeMenuOpenSetOf'), type.name) });
				} else
				if (message.records.length == 2) {
					options.push({ id: 'setOpenMenu', name: translate('blockFeaturedTypeMenuOpenSet'), arrow: true });
				} else
				if (type && !type.isDeleted) {
					options.push({ id: 'setCreate', name: UtilCommon.sprintf(translate('blockFeaturedTypeMenuCreateSetOf'), type.name) });
				};

				showMenu();
			});
		};
	};

	onTypeOver (e: any, item: any) {
		const { rootId, block } = this.props;

		if (!item.arrow) {
			menuStore.closeAll(Constant.menuIds.featuredType);
			return;
		};

		const object = detailStore.get(rootId, rootId, [ 'setOf' ]);

		let menuId = '';
		let menuParam = {
			element: `#${this.menuContext.getId()} #item-${item.id}`,
			offsetX: this.menuContext.getSize().width,
			className: 'big single',
			vertical: I.MenuDirection.Center,
			isSub: true,
			data: {
				isBig: true,
				rootId: rootId,
				blockId: block.id,
				blockIds: [ block.id ],
				rebind: this.menuContext.ref.rebind,
			}
		};

		switch (item.id) {
			case 'change':
				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
					filter: '',
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
					],
					onClick: (item: any) => {
						detailStore.update(rootId, { id: item.id, details: item }, false);
						C.ObjectSetObjectType(rootId, item.id, () => {
							UtilObject.openAuto({ ...object, layout: item.recommendedLayout });
						});

						this.menuContext.close();
						analytics.event('ChangeObjectType', { objectType: item.id });
					},
				});
				break;

			case 'setOpenMenu':
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set },
						{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.In, value: [ object.type ] }
					],
					onSelect: (item: any) => {
						UtilObject.openPopup({ id: item.id, layout: I.ObjectLayout.Set });
						this.menuContext.close();
					}
				});
		};

		if (menuId && !menuStore.isOpen(menuId)) {
			if (menuStore.isOpen(menuId)) {
				menuStore.open(menuId, menuParam);
			} else {
				menuStore.closeAll(Constant.menuIds.featuredType, () => {
					menuStore.open(menuId, menuParam);
				});
			};
		};
	};

	onTypeSelect (e: any, item: any) {
		if (item.arrow) {
			return;
		};

		const { rootId, isPopup } = this.props;
		const object = detailStore.get(rootId, rootId, [ 'setOf', 'collectionOf' ]);
		const type = dbStore.getType(object.type);

		this.menuContext.close();

		switch (item.id) {
			case 'open':
				UtilObject.openPopup(type);
				break;

			case 'setOpen':
				UtilObject.openPopup({ id: this.setId, layout: I.ObjectLayout.Set });
				break;

			case 'setCreate':
				const details: any = {};

				if (type) {
					details.name = type.name + ' set';
					details.iconEmoji = type.iconEmoji;
				};

				C.ObjectCreateSet([ object.type ], details, '', (message: any) => {
					if (!message.error.code) {
						UtilObject.openPopup(message.details);
					};
				});
				break;

			case 'turnCollection':
				C.ObjectToCollection(rootId, (message: any) => {
					if (message.error.code) {
						return;
					};

					if (isPopup) {
						historyPopup.clear();
					};

					keyboard.disableClose(true);
					UtilObject.openAuto({ id: rootId, layout: I.ObjectLayout.Collection }, { replace: true });
					window.setTimeout(() => { Preview.toastShow({ text: UtilCommon.sprintf(translate('toastTurnIntoCollection'), object.name) }); }, 200);

					analytics.event('SetTurnIntoCollection');
				});
				break;
		};
	};

	onSource () {
		const { rootId, block, readonly } = this.props;

		if (readonly || menuStore.isOpen('dataviewSource')) {
			return;
		};

		menuStore.closeAll(null, () => {
			menuStore.open('dataviewSource', {
				element: `#block-${block.id} #${Relation.cellId(PREFIX, 'setOf', rootId)}`,
				className: 'big single',
				horizontal: I.MenuDirection.Center,
				data: {
					rootId,
					objectId: rootId,
					blockId: Constant.blockId.dataview,
				}
			}); 
		});
	};

	onRelation (e: any, relationKey: string) {
		e.stopPropagation();

		if (menuStore.isOpen()) {
			menuStore.closeAll();
			return;
		};

		const { isPopup, rootId, readonly } = this.props;
		const relation = dbStore.getRelationByKey(relationKey);

		if (readonly) {
			return;
		};

		if (relation.format == I.RelationType.Checkbox) {
			const object = detailStore.get(rootId, rootId, [ relationKey ]);
			const details = [ 
				{ key: relationKey, value: Relation.formatValue(relation, !object[relationKey], true) },
			];
			C.ObjectSetDetails(rootId, details);
			return;
		};

		const param: any = {
			element: '#header',
			horizontal: I.MenuDirection.Right,
			noFlipY: true,
			noAnimation: true,
			subIds: Constant.menuIds.cell,
			onOpen: (component: any) => {
				if (component && component.ref) {
					component.ref.onCellClick(e, relationKey);
					component.ref.scrollTo(relationKey);
				};
			},
			onClose: () => {
				menuStore.closeAll();
			},
			data: {
				relationKey: '',
				rootId,
			},
		};

		if (!isPopup) {
			param.fixedY = UtilCommon.sizeHeader();
			param.classNameWrap = 'fixed fromHeader';
		};

		menuStore.closeAll(null, () => { menuStore.open('blockRelationView', param); });
	};

	elementMapper (relation: any, item: any) {
		item = UtilCommon.objectCopy(item);

		switch (relation.format) {
			case I.RelationType.File:
			case I.RelationType.Object:
				item.name = UtilCommon.shorten(item.name);
				break;

			case I.RelationType.Tag:
			case I.RelationType.Status:
				item.text = UtilCommon.shorten(item.text);
				break;
		};

		return item;
	};

	getStoreId (): string {
		const rootId = String(this.props.rootId || '');
		const traceId = String(this.props.traceId || '');

		return traceId ? rootId.replace('-' + traceId, '') : rootId;
	};
	
});

export default BlockFeatured;
