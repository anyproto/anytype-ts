import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { ObjectType, Cell } from 'Component';
import { I, C, S, U, J, Preview, focus, analytics, Relation, Onboarding, history as historyPopup, keyboard, translate } from 'Lib';

interface Props extends I.BlockComponent {
	size?: number;
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
		size: 18,
		iconSize: 18,
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
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.onRelation = this.onRelation.bind(this);
		this.elementMapper = this.elementMapper.bind(this);
	};

	render () {
		const { rootId, block, size, iconSize, isPopup } = this.props;
		const storeId = this.getStoreId();
		const short = S.Detail.get(rootId, storeId, [ 'featuredRelations' ], true);
		const featuredRelations = Relation.getArrayValue(short.featuredRelations);
		const object = S.Detail.get(rootId, storeId, featuredRelations);
		const allowedValue = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const items = this.getItems();

		return (
			<div 
				ref={node => this.node = node}
				className={[ 'wrap', 'focusable', 'c' + block.id ].join(' ')} 
				tabIndex={0} 
				onKeyDown={this.onKeyDown} 
				onKeyUp={this.onKeyUp}
			>

				{this.renderType()}
				{this.renderSetOf()}
				{this.renderIdentity()}

				{items.map((relationKey: any, i: any) => {
					const id = Relation.cellId(PREFIX, relationKey, object.id);
					const relation = S.Record.getRelationByKey(relationKey);
					const value = object[relationKey];
					const canEdit = allowedValue && !relation.isReadonlyValue;
					const cn = [ 'cell', (canEdit ? 'canEdit' : '') ];

					if (i == items.length - 1) {
						cn.push('last');
					};

					if ([ 'links', 'backlinks' ].includes(relationKey)) {
						return this.renderLinks(relationKey, i);
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
							<Cell
								ref={ref => this.cellRefs.set(id, ref)}
								placeholder={relation.name}
								elementId={id}
								rootId={rootId}
								subId={rootId}
								block={block}
								relationKey={relationKey}
								getRecord={() => object}
								viewType={I.ViewType.Grid}
								pageContainer={U.Common.getCellContainer(isPopup ? 'popup' : 'page')}
								size={size}
								iconSize={iconSize}
								readonly={!canEdit}
								isInline={true}
								idPrefix={PREFIX}
								elementMapper={this.elementMapper}
								showTooltip={true}
								tooltipX={I.MenuDirection.Left}
								arrayLimit={relation.format == I.RelationType.Object ? 1 : 2}
								textLimit={150}
								onMouseLeave={this.onMouseLeave}
								withName={true}
							/>
							<div className="bullet" />
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
			}, S.Menu.getTimeout());
		};

		this.init();
	};

	componentDidUpdate (): void {
		this.init();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	init () {
		const { rootId, block } = this.props;
		const storeId = this.getStoreId();
		const short = S.Detail.get(rootId, storeId, [ 'featuredRelations' ], true);
		const featuredRelations = Relation.getArrayValue(short.featuredRelations).filter(it => it != 'description');
		const node = $(this.node);
		const obj = $(`#block-${block.id}`);

		featuredRelations.length ? obj.removeClass('isHidden') : obj.addClass('isHidden');

		if (node) {
			node.find('.cell.first').removeClass('first');
			node.find('.cell').first().addClass('first');
		};
	};

	renderType () {
		const { rootId } = this.props;
		const featuredRelations = this.getRelationList();

		if (!featuredRelations.includes('type')) {
			return null;
		};

		const object = this.getObject();
		const type = S.Detail.get(rootId, object.type, [ 'name', 'isDeleted' ]);
		const name = (
			<div className="name">
				<ObjectType object={type} />
			</div>
		);

		let ret = null;

		if (U.Object.isTemplate(object.type)) {
			ret = (
				<span className="cell">
					<div className="cellContent type disabled">{name}</div>
					<div className="bullet" />
				</span>
			);
		} else {
			ret = (
				<span className="cell canEdit">
					<div
						id={Relation.cellId(PREFIX, 'type', object.id)}
						className="cellContent type"
						onClick={this.onType}
						onMouseEnter={e => this.onMouseEnter(e, 'type')}
						onMouseLeave={this.onMouseLeave}
					>
						{name}
					</div>
					<div className="bullet" />
				</span>
			);
		};

		return ret;
	};

	renderSetOf () {
		const { rootId, readonly } = this.props;
		const storeId = this.getStoreId();
		const featuredRelations = this.getRelationList();

		if (!featuredRelations.includes('setOf')) {
			return null;
		};

		const object = this.getObject();
		const types = Relation.getSetOfObjects(rootId, storeId, I.ObjectLayout.Type).map(it => it.name);
		const relations = Relation.getSetOfObjects(rootId, storeId, I.ObjectLayout.Relation).map(it => it.name);
		const setOfString = [];
		const tl = types.length;
		const rl = relations.length;

		if (tl) {
			setOfString.push(U.Common.sprintf('%s: %s', U.Common.plural(tl, translate('pluralObjectType')), types.slice(0, SOURCE_LIMIT).join(', ')));

			if (tl > SOURCE_LIMIT) {
				setOfString.push(<div className="more">+{tl - SOURCE_LIMIT}</div>);
			};
		};
		if (rl) {
			setOfString.push(`${U.Common.plural(rl, translate('pluralRelation'))}: ${relations.slice(0, SOURCE_LIMIT).join(', ')}`);

			if (rl > SOURCE_LIMIT) {
				setOfString.push(<div className="more">+{rl - SOURCE_LIMIT}</div>);
			};
		};

		return (
			<span className={[ 'cell', (!readonly ? 'canEdit' : '') ].join(' ')}>
				<div
					id={Relation.cellId(PREFIX, 'setOf', object.id)}
					className="cellContent setOf"
					onClick={this.onSource}
					onMouseEnter={e => this.onMouseEnter(e, 'setOf', translate('blockFeaturedQuery'))}
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
				<div className="bullet" />
			</span>
		);
	};

	renderIdentity () {
		const { rootId } = this.props;
		const storeId = this.getStoreId();
		const short = S.Detail.get(rootId, storeId, [ 'layout' ], true);

		if (short.layout != I.ObjectLayout.Participant) {
			return null;
		};

		const object = S.Detail.get(rootId, storeId, U.Data.participantRelationKeys());
		const relationKey = object.globalName ? 'globalName': 'identity';

		return (
			<span className="cell">
				<div
					id={Relation.cellId(PREFIX, relationKey, object.id)}
					className="cellContent c-longText"
					onClick={(e: any) => {
						e.persist();
						this.onRelation(e, relationKey);
					}}
					onMouseEnter={e => this.onMouseEnter(e, relationKey, translate('blockFeaturedIdentity'))}
					onMouseLeave={this.onMouseLeave}
				>
					<div className="name">
						{U.Common.shorten(object[relationKey], 150)}
					</div>
				</div>
				<div className="bullet" />
			</span>
		);
	};

	renderLinks (relationKey: string, index: number) {
		const { rootId } = this.props;
		const object = this.getObject();
		const id = Relation.cellId(PREFIX, relationKey, object.id);
		const value = object[relationKey];
		const options = Relation.getArrayValue(value).map(it => S.Detail.get(rootId, it, [])).filter(it => !it._empty_);
		const l = options.length;

		if (!l) {
			return null;
		};

		return (
			<span className="cell" key={index} >
				<div 
					id={id} 
					className="cellContent"
					onClick={e => this.onLinks(e, relationKey)}
				>
					{`${l} ${U.Common.plural(l, translate(U.Common.toCamelCase([ 'plural', relationKey ].join('-'))))}`}
				</div>
				<div className="bullet" />
			</span>
		);
	};

	getRelationList () {
		const object = S.Detail.get(this.props.rootId, this.getStoreId(), [ 'featuredRelations' ], true);
		return Relation.getArrayValue(object.featuredRelations);
	};

	getObject () {
		return S.Detail.get(this.props.rootId, this.getStoreId(), this.getRelationList());
	};

	checkType () {
		const { rootId, isPopup } = this.props;
		const storeId = this.getStoreId();
		const object = S.Detail.get(rootId, storeId, [ 'type' ], true);
		const type = S.Detail.get(rootId, object.type, [ 'isDeleted' ], true);

		if (type.isDeleted) {
			Onboarding.start('typeDeleted', isPopup);
		};
	};

	checkSource () {
		const { rootId, isPopup } = this.props;
		const storeId = this.getStoreId();
		const object = S.Detail.get(rootId, storeId, [ 'layout', 'setOf', 'featuredRelations' ]);
		const featuredRelations = Relation.getArrayValue(object.featuredRelations);

		if (object._empty_ || !U.Object.isSetLayout(object.layout) || !featuredRelations.includes('setOf')) {
			return;
		};

		const setOf = Relation.getArrayValue(object.setOf);
		const types = Relation.getSetOfObjects(rootId, rootId, I.ObjectLayout.Type);
		const relations = Relation.getSetOfObjects(rootId, rootId, I.ObjectLayout.Relation);

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
		const object = S.Detail.get(rootId, storeId, [ 'featuredRelations' ], true);
		const skipIds = [
			'type',
			'description',
			'setOf',
		];

		return (object.featuredRelations || []).filter(it => S.Record.getRelationByKey(it) && !skipIds.includes(it));
	};

	onFocus () {
		focus.set(this.props.block.id, { from: 0, to: 0 });
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

	onMouseEnter (e: any, relationKey: string, text?: string) {
		const { rootId } = this.props;
		const cell = $(`#${Relation.cellId(PREFIX, relationKey, rootId)}`);
		const relation = S.Record.getRelationByKey(relationKey);
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
		const object = S.Detail.get(rootId, rootId, [ 'setOf' ]);
		const type = S.Detail.get(rootId, object.type, []);
		const allowed = S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Type ]);
		const typeIsDeleted = type._empty_ || type.isDeleted;
		const options: any[] = [];

		if (!typeIsDeleted) {
			options.push({ id: 'open', name: translate('blockFeaturedTypeMenuOpenType') });
		};

		if (!readonly) {
			if (allowed) {
				options.push({ id: 'change', name: translate('blockFeaturedTypeMenuChangeType'), arrow: true });
			};

			if (!typeIsDeleted && U.Object.isSetLayout(object.layout)) {
				options.push({ id: 'turnCollection', name: translate('blockFeaturedTypeMenuTurnSetIntoCollection') });
			};
		};

		const showMenu = () => {
			S.Menu.open('select', {
				element: `#block-${block.id} #${Relation.cellId(PREFIX, 'type', rootId)}`,
				offsetY: 4,
				subIds: J.Menu.featuredType,
				onOpen: context => this.menuContext = context,
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
			U.Data.checkSetCnt([ object.type ], (message: any) => {
				if (message.records.length == 1) {
					this.setId = message.records[0].id;
					options.push({ id: 'setOpen', name: U.Common.sprintf(translate('blockFeaturedTypeMenuOpenSetOf'), type.name) });
				} else
				if (message.records.length == 2) {
					options.push({ id: 'setOpenMenu', name: translate('blockFeaturedTypeMenuOpenSet'), arrow: true });
				} else
				if (type && !type.isDeleted) {
					options.push({ id: 'setCreate', name: U.Common.sprintf(translate('blockFeaturedTypeMenuCreateSetOf'), type.name) });
				};

				showMenu();
			});
		};
	};

	onTypeOver (e: any, item: any) {
		const { rootId, block } = this.props;

		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.featuredType);
			return;
		};

		const object = S.Detail.get(rootId, rootId, [ 'setOf', 'internalFlags' ]);

		const menuParam = {
			element: `#${this.menuContext.getId()} #item-${item.id}`,
			offsetX: this.menuContext.getSize().width,
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

		let menuId = '';

		switch (item.id) {
			case 'change':
				menuId = 'typeSuggest';
				menuParam.data = Object.assign(menuParam.data, {
					filter: '',
					filters: [
						{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
						{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
					],
					keys: U.Data.typeRelationKeys(),
					skipIds: [ object.type ],
					onClick: (item: any) => {
						keyboard.disableClose(true);

						const open = () => {
							U.Object.openAuto({ ...object, layout: item.recommendedLayout });
							keyboard.disableClose(false);
						};

						S.Detail.update(rootId, { id: item.id, details: item }, false);

						C.ObjectSetObjectType(rootId, item.uniqueKey, () => {
							if (object.internalFlags && object.internalFlags.includes(I.ObjectFlag.SelectTemplate)) {
								C.ObjectApplyTemplate(rootId, item.defaultTemplateId || J.Constant.templateId.blank, open);
							} else {
								open();
							};
						});

						this.menuContext.close();
						analytics.event('ChangeObjectType', { objectType: item.id, count: 1, route: analytics.route.featured });
					},
				});
				break;

			case 'setOpenMenu':
				menuId = 'searchObject';
				menuParam.data = Object.assign(menuParam.data, {
					filters: [
						{ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Set },
						{ relationKey: 'setOf', condition: I.FilterCondition.In, value: [ object.type ] }
					],
					onSelect: (item: any) => {
						U.Object.openConfig({ id: item.id, layout: I.ObjectLayout.Set });
						this.menuContext.close();
					}
				});
		};

		if (menuId && !S.Menu.isOpen(menuId)) {
			if (S.Menu.isOpen(menuId)) {
				S.Menu.open(menuId, menuParam);
			} else {
				S.Menu.closeAll(J.Menu.featuredType, () => {
					S.Menu.open(menuId, menuParam);
				});
			};
		};
	};

	onTypeSelect (e: any, item: any) {
		if (item.arrow) {
			return;
		};

		const { rootId, isPopup } = this.props;
		const object = S.Detail.get(rootId, rootId, [ 'setOf', 'collectionOf' ]);
		const type = S.Record.getTypeById(object.type);

		this.menuContext?.close();

		switch (item.id) {
			case 'open':
				U.Object.openConfig(type);
				break;

			case 'setOpen':
				U.Object.openConfig({ id: this.setId, layout: I.ObjectLayout.Set });
				break;

			case 'setCreate':
				const details: any = {};

				if (type) {
					details.name = U.Common.sprintf(translate('commonSetName'), type.name);
					details.iconEmoji = type.iconEmoji;
				};

				C.ObjectCreateSet([ object.type ], details, '', S.Common.space, (message: any) => {
					if (!message.error.code) {
						const object = message.details;

						U.Object.openConfig(object);
						analytics.createObject(object.type, object.layout, analytics.route.featured, message.middleTime);
					};
				});
				break;

			case 'turnCollection':
				// Add Collection type to details since middleware adds details async
				const collectionType = S.Record.getCollectionType();
				if (collectionType) {
					S.Detail.update(rootId, { id: collectionType.id, details: collectionType }, true);
				};

				C.ObjectToCollection(rootId, (message: any) => {
					if (message.error.code) {
						return;
					};

					if (isPopup) {
						historyPopup.clear();
					};

					keyboard.disableClose(true);
					U.Object.openAuto({ id: rootId, layout: I.ObjectLayout.Collection }, { replace: true });
					window.setTimeout(() => { Preview.toastShow({ text: U.Common.sprintf(translate('toastTurnIntoCollection'), object.name) }); }, 200);

					analytics.event('SetTurnIntoCollection');
				});
				break;
		};
	};

	onSource () {
		const { rootId, block, readonly } = this.props;

		if (readonly || S.Menu.isOpen('dataviewSource')) {
			return;
		};

		S.Menu.closeAll(null, () => {
			S.Menu.open('dataviewSource', {
				element: `#block-${block.id} #${Relation.cellId(PREFIX, 'setOf', rootId)}`,
				noFlipX: true,
				offsetY: 4,
				data: {
					rootId,
					objectId: rootId,
					blockId: J.Constant.blockId.dataview,
				}
			}); 
		});
	};

	onRelation (e: any, relationKey: string) {
		e.stopPropagation();

		if (S.Menu.isOpen()) {
			S.Menu.closeAll();
			return;
		};

		const { isPopup, rootId } = this.props;
		const storeId = this.getStoreId();
		const object = S.Detail.get(rootId, storeId, [ relationKey ]);
		const relation = S.Record.getRelationByKey(relationKey);

		if (!relation) {
			return;
		};

		let menuId = '';
		let menuParam: any = {};
		let menuData: any = {};

		switch (relation.format) {
			case I.RelationType.Object: {
				menuId = 'dataviewObjectValues';
				menuParam.subIds = [ 'dataviewObjectList' ];
				menuData = {
					types: relation.objectTypes,
					value: Relation.getArrayValue(object[relationKey]),
					filters: []
				};
				break;
			};

			case I.RelationType.Date: {
				let value = null;
				let isEmpty = false;

				if (object[relationKey]) {
					value = Number(object[relationKey]);
				} else {
					value = Number(U.Date.now());
					isEmpty = true;
				};

				menuId = 'dataviewCalendar';
				menuData = {
					value,
					isEmpty,
				};
				break;
			};

			case I.RelationType.Select:
			case I.RelationType.MultiSelect: {
				menuId = 'dataviewOptionList';
				menuData = {
					value: Relation.getArrayValue(object[relationKey]),
					canAdd: true,
					maxCount: relation.maxCount,
				};
				break;
			};

			case I.RelationType.File: {
				menuId = 'dataviewFileValues';
				menuParam = {
					width: 280,
					subIds: [ 'dataviewFileList' ],
				};
				menuData = {
					value: object[relationKey] || [],
					subId: rootId,
				};
				break;
			};

			case I.RelationType.Number:
			case I.RelationType.Url:
			case I.RelationType.Phone:
			case I.RelationType.Email:
			case I.RelationType.ShortText:
			case I.RelationType.LongText: {
				menuId = 'dataviewText';
				menuParam.width = 288;
				menuData.value = object[relationKey] || '';
				break;
			};

			case I.RelationType.Checkbox: {
				if (!this.canEdit(relation)) {
					break;
				};

				const object = S.Detail.get(rootId, rootId, [ relationKey ]);
				const value = Relation.formatValue(relation, !object[relationKey], true);

				C.ObjectListSetDetails([ rootId ], [ { key: relationKey, value } ]);
				analytics.changeRelationValue(relation, value, { type: 'featured', id: 'Single' });
				return;
			};
		};

		if (menuId) {
			this.onCellMenu(relationKey, menuId, menuParam, menuData);
		} else {
			const param: Partial<I.MenuParam> = {
				element: '#header',
				horizontal: I.MenuDirection.Right,
				noFlipY: true,
				noAnimation: true,
				subIds: J.Menu.cell,
				onOpen: (component: any) => {
					if (component && component.ref) {
						component.ref.onCellClick(e, relationKey);
						component.ref.scrollTo(relationKey);
					};
				},
				onClose: () => S.Menu.closeAll(),
				data: {
					relationKey,
					rootId,
				},
			};

			if (!isPopup) {
				param.fixedY = J.Size.header;
				param.classNameWrap = 'fixed fromHeader';
			};

			S.Menu.closeAll(null, () => S.Menu.open('blockRelationView', param));
		};
	};

	onCellMenu (relationKey: string, menuId: string, param: any, data: any) {
		const { rootId, block, readonly } = this.props;
		const storeId = this.getStoreId();
		const object = S.Detail.get(rootId, storeId, [ relationKey ]);
		const relation = S.Record.getRelationByKey(relationKey);
		const elementId = `#block-${block.id} #${Relation.cellId(PREFIX, relationKey, object.id)}`;

		if (!relation) {
			return;
		};

		let menuParam = {
			element: elementId,
			className: 'fromFeatured',
			offsetY: 4,
			noFlipX: true,
			title: relation.name,
			onClose: () => S.Menu.closeAll(),
			data: {
				rootId,
				blockId: block.id,
				relation: observable.box(relation),
				relationKey,
				canEdit: this.canEdit(relation),
				onChange: (v: any, callBack?: () => void) => {
					const value = Relation.formatValue(relation, v, true);

					C.ObjectListSetDetails([ rootId ], [ { key: relationKey, value } ]);
					analytics.changeRelationValue(relation, value, { type: 'featured', id: 'Single' });

					if (callBack) {
						callBack();
					};
				}
			}
		};

		menuParam = Object.assign(menuParam, param);
		menuParam.data = Object.assign(menuParam.data, data);

		S.Menu.closeAll(J.Menu.cell, () => {
			S.Menu.open(menuId, menuParam);
		});
	};

	onLinks (e: React.MouseEvent, relationKey: string) {
		const { rootId, block } = this.props;
		const storeId = this.getStoreId();
		const relation = S.Record.getRelationByKey(relationKey);

		if (!relation) {
			return;
		};

		const object = S.Detail.get(rootId, storeId);
		const value = Relation.getArrayValue(object[relationKey]);
		const elementId = `#block-${block.id} #${Relation.cellId(PREFIX, relationKey, object.id)}`;
		const options = value.map(it => S.Detail.get(rootId, it, [])).filter(it => !it._empty_).map(it => ({
			...it,
			withDescription: true,
			iconSize: 40,
			object: it,
		}));

		S.Menu.closeAll([ 'select' ], () => {
			S.Menu.open('select', {
				element: elementId,
				className: 'featuredLinks',
				title: relation.name,
				width: 360,
				offsetY: 4,
				noFlipY: true,
				data: {
					options,
					withDefault: true,
					onSelect: (e: any, item: any) => {
						U.Object.openAuto(item);
					}
				}
			});
		});
	};

	elementMapper (relation: any, item: any) {
		item = U.Common.objectCopy(item);

		switch (relation.format) {
			case I.RelationType.File:
			case I.RelationType.Object:
				item.name = U.Common.shorten(item.name, 150);
				break;

			case I.RelationType.MultiSelect:
			case I.RelationType.Select:
				item.text = U.Common.shorten(item.text, 150);
				break;
		};

		return item;
	};

	getStoreId (): string {
		const rootId = String(this.props.rootId || '');
		const traceId = String(this.props.traceId || '');

		return traceId ? rootId.replace('-' + traceId, '') : rootId;
	};

	canEdit (relation: any) {
		const { readonly } = this.props;
		return !readonly && !relation.isReadonlyValue;
	};
	
});

export default BlockFeatured;
