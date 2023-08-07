import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Header, Footer, Loader, ListObjectPreview, ListObject, Select, Deleted } from 'Component';
import { I, C, UtilData, UtilObject, UtilMenu, UtilCommon, focus, Action, analytics, Relation, translate } from 'Lib';
import { commonStore, detailStore, dbStore, menuStore, popupStore, blockStore } from 'Store';
import Controls from 'Component/page/head/controls';
import HeadSimple from 'Component/page/head/simple';
import Constant from 'json/constant.json';
import Errors from 'json/error.json';

interface State {
	isLoading: boolean;
	isDeleted: boolean;
};

const PageMainType = observer(class PageMainType extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	id = '';
	refHeader: any = null;
	refHead: any = null;
	refListPreview: any = null;
	timeout = 0;
	page = 0;

	state = {
		isLoading: false,
		isDeleted: false,
	};

	constructor (props: I.PageComponent) {
		super(props);
		
		this.onTemplateAdd = this.onTemplateAdd.bind(this);
		this.onObjectAdd = this.onObjectAdd.bind(this);
		this.onRelationAdd = this.onRelationAdd.bind(this);
		this.onSetAdd = this.onSetAdd.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onLayout = this.onLayout.bind(this);
	};

	render () {
		const { isLoading, isDeleted } = this.state;

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (isLoading) {
			return <Loader id="loader" />;
		};

		const { config } = commonStore;
		const rootId = this.getRootId();
		const check = UtilData.checkDetails(rootId);
		const object = detailStore.get(rootId, rootId);
		const subIdTemplate = this.getSubIdTemplate();
		const templates = dbStore.getRecords(subIdTemplate, '');

		const layout: any = UtilMenu.getLayouts().find(it => it.id == object.recommendedLayout) || {};
		const showTemplates = !UtilObject.getLayoutsWithoutTemplates().includes(object.recommendedLayout);
		const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);
		const systemRelations = Relation.systemKeys();

		const allowedObject = object.isInstalled && UtilObject.getPageLayouts().includes(object.recommendedLayout);
		const allowedDetails = object.isInstalled && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const allowedRelation = object.isInstalled && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		const allowedTemplate = object.isInstalled && allowedObject && showTemplates;
		const allowedLayout = rootId != Constant.typeId.bookmark;
		
		const totalObject = dbStore.getMeta(this.getSubIdObject(), '').total;
		const totalTemplate = templates.length + (allowedTemplate ? 1 : 0);

		if (!recommendedRelations.includes('rel-description')) {
			recommendedRelations.push('rel-description');
		};

		const relations = recommendedRelations.map(id => dbStore.getRelationById(id)).filter(it => {
			if (!it) {
				return false;
			};
			if ([ 'tag', 'description' ].includes(it.relationKey)) {
				return true;
			};
			if (systemRelations.includes(it.relationKey)) {
				return false;
			};
			return config.debug.ho ? true : !it.isHidden;
		});

		const isFileType = UtilObject.isFileType(rootId);
		const columns: any[] = [
			{ 
				relationKey: 'lastModifiedDate', name: translate('commonUpdated'),
				mapper: (v: any) => UtilCommon.date(UtilData.dateFormat(I.DateFormat.MonthAbbrBeforeDay), v),
			},
		];

		if (!isFileType) {
			columns.push({ relationKey: 'creator', name: translate('pageMainTypeOwner'), isObject: true });
		};

		const ItemRelation = (item: any) => (
			<div id={'item-' + item.id} className={[ 'item', (item.isHidden ? 'isHidden' : ''), 'canEdit' ].join(' ')}>
				<div className="clickable" onClick={(e: any) => { this.onRelationEdit(e, item.id); }}>
					<Icon className={[ 'relation', Relation.className(item.format) ].join(' ')} />
					<div className="name">{item.name}</div>
				</div>
			</div>
		);

		const ItemAdd = () => (
			<div id="item-add" className="item add" onClick={this.onRelationAdd}>
				<div className="clickable">
					<Icon className="plus" />
					<div className="name">{translate('commonNew')}</div>
				</div>
				<div className="value" />
			</div>
		);

		return (
			<div>
				<Header component="mainObject" ref={ref => this.refHeader = ref} {...this.props} rootId={rootId} />

				<div className={[ 'blocks', 'wrapper', check.className ].join(' ')}>
					<Controls key="editorControls" {...this.props} rootId={rootId} resize={() => {}} />
					<HeadSimple ref={ref => this.refHead = ref} type="Type" rootId={rootId} onCreate={this.onCreate} />

					{showTemplates ? (
						<div className="section template">
							<div className="title">
								{totalTemplate} {UtilCommon.plural(totalTemplate, translate('pluralTemplate'))}

								{allowedTemplate ? (
									<div className="btn" onClick={this.onTemplateAdd}>
										<Icon className="plus" />{translate('commonNew')}
									</div>
								) : ''}
							</div>

							{totalTemplate ? (
								<div className="content">
									<ListObjectPreview 
										key="listTemplate"
										ref={ref => this.refListPreview = ref}
										getItems={() => dbStore.getRecords(subIdTemplate, '').map(id => detailStore.get(subIdTemplate, id, []))}
										canAdd={allowedTemplate}
										onAdd={this.onTemplateAdd}
										onMenu={allowedTemplate ? (e: any, item: any) => this.onMenu(item) : null}
										onClick={(e: any, item: any) => UtilObject.openPopup(item)}
										withBlank={true}
										defaultId={object.defaultTemplateId || Constant.templateId.blank}
									/>
								</div>
							) : (
								<div className="empty">
									{translate('pageMainTypeNoTemplates')}
								</div>
							)}
						</div>
					) : ''}

					<div className="section note dn">
						<div className="title"></div>
						<div className="content"></div>
					</div>

					{allowedObject ? (
						<React.Fragment>
							{allowedLayout ? (
								<div className="section layout">
									<div className="title">{translate('pageMainTypeRecommendedLayout')}</div>
									<div className="content">
										{allowedDetails ? (
											<Select 
												id="recommendedLayout" 
												value={object.recommendedLayout} 
												options={UtilMenu.turnLayouts()} 
												arrowClassName="light" 
												onChange={this.onLayout} 
											/>
										) : (
											<React.Fragment>
												<Icon className={layout.icon} />
												<div className="name">{layout.name}</div>
											</React.Fragment>
										)}
									</div>
								</div>
							) : ''}

							<div className="section relation">
								<div className="title">{relations.length} {UtilCommon.plural(relations.length, translate('pluralRelation'))}</div>
								<div className="content">
									{relations.map((item: any, i: number) => (
										<ItemRelation key={i} {...item} />
									))}
									{allowedRelation ? <ItemAdd /> : ''}
								</div>
							</div>
						</React.Fragment>
					) : ''}

					{object.isInstalled ? (
						<div className="section set">
							<div className="title">{totalObject} {UtilCommon.plural(totalObject, translate('pluralObject'))}</div>
							<div className="content">
								<ListObject rootId={rootId} columns={columns} />
							</div>
						</div>
					) : ''}
				</div>

				<Footer component="mainObject" {...this.props} />
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.open();
	};

	componentDidUpdate () {
		this.open();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.close();
	};

	open () {
		const rootId = this.getRootId();

		if (this.id == rootId) {
			return;
		};

		this.id = rootId;
		this.setState({ isLoading: true });

		C.ObjectOpen(rootId, '', (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.setState({ isDeleted: true, isLoading: false });
				} else {
					UtilObject.openHome('route');
				};
				return;
			};

			const object = detailStore.get(rootId, rootId, []);
			if (object.isArchived || object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			this.setState({ isLoading: false });
			this.loadTemplates();

			if (this.refHeader) {
				this.refHeader.forceUpdate();
			};
			if (this.refHead) {
				this.refHead.forceUpdate();
			};
		});
	};

	loadTemplates () {
		const { workspace } = commonStore;
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);

		UtilData.searchSubscribe({
			subId: this.getSubIdTemplate(),
			filters: [
				{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: [ Constant.storeTypeId.template, Constant.typeId.template ] },
				{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.Equal, value: rootId },
				{ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: object.isInstalled ? workspace : Constant.storeSpaceId },
			],
			sorts: [
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc, includeTime: true }
			],
			keys: [ 'id' ],
			ignoreWorkspace: true,
			ignoreDeleted: true,
		});
	};

	close () {
		const { isPopup, match } = this.props;
		const rootId = this.getRootId();
		
		let close = true;
		if (isPopup && (match.params.id == rootId)) {
			close = false;
		};

		if (close) {
			Action.pageClose(rootId, true);
		};
	};

	onTemplateAdd () {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);
		const details: any = { 
			type: Constant.typeId.template, 
			targetObjectType: rootId,
			layout: object.recommendedLayout,
		};

		C.ObjectCreate(details, [], '', (message) => {
			if (message.error.code) {
				return;
			};

			focus.clear(true);
			analytics.event('CreateTemplate', { objectType: rootId, route: 'Library' });

			this.templateOpen(message.details);
		});
	};

	templateOpen (object: any) {
		UtilObject.openPopup(object, {
			onClose: () => $(window).trigger(`updatePreviewObject.${object.id}`)
		});
	};

	onCreate () {
		const rootId = this.getRootId();
		const type = dbStore.getType(rootId);
		const isSetType = UtilObject.isSetType(rootId);
		const allowedObject = UtilObject.getPageLayouts().includes(type.recommendedLayout) || isSetType;
		const options = [];

		if (allowedObject) {
			options.push({ id: 'object', name: translate('pageMainTypeNewObject') });
		};

		options.push({ id: 'set', name: translate('pageMainTypeNewSetOfObjects') });

		menuStore.open('select', { 
			element: `#button-create`,
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			data: {
				options: options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'object':
							if (rootId == Constant.typeId.bookmark) {
								this.onBookmarkAdd();
							} else {
								this.onObjectAdd();
							};
							break;

						case 'set':
							this.onSetAdd();
							break;
					};
				},
			},
		});
	};

	onObjectAdd () {
		const rootId = this.getRootId();
		const details: any = {
			type: rootId,
		};

		if (rootId == Constant.typeId.set) {
			details.layout = I.ObjectLayout.Set;
		} else
		if (rootId == Constant.typeId.collection) {
			details.layout = I.ObjectLayout.Collection;
		};

		const create = (template: any) => {
			UtilObject.create('', '', details, I.BlockPosition.Bottom, template?.id, {}, [], (message: any) => {
				UtilObject.openPopup({ ...details, id: message.targetId });

				analytics.event('CreateObject', {
					route: 'ObjectType',
					objectType: rootId,
					layout: template?.layout,
					template: (template && template.templateIsBundled ? template.id : 'custom'),
				});
			});
		};

		const showMenu = () => {
			popupStore.open('template', {
				data: {
					typeId: rootId,
					onSelect: create,
				},
			});
		};

		UtilData.checkTemplateCnt([ rootId ], (cnt: number) => {
			cnt ? showMenu() : create('');
		});
	};

	onBookmarkAdd () {
		menuStore.open('dataviewCreateBookmark', {
			type: I.MenuType.Horizontal,
			element: `#button-create`,
			horizontal: I.MenuDirection.Right,
		});
	};

	onSetAdd () {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);
		const details = { 
			name: object.name + ' set', 
			iconEmoji: object.iconEmoji,
		};

		C.ObjectCreateSet([ rootId ], details, '', (message: any) => {
			if (!message.error.code) {
				focus.clear(true);
				UtilObject.openPopup(message.details);
			};
		});
	};

	onRelationAdd (e: any) {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, [ 'recommendedRelations' ], true);
		const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);

		menuStore.open('relationSuggest', { 
			element: '#page .section.relation #item-add',
			offsetX: 32,
			data: {
				filter: '',
				rootId,
				ref: 'type',
				menuIdEdit: 'blockRelationEdit',
				skipKeys: recommendedRelations.concat(Relation.systemKeys()),
				addCommand: (rootId: string, blockId: string, relation: any, onChange: (message: any) => void) => {
					C.ObjectTypeRelationAdd(rootId, [ relation.relationKey ], (message: any) => { 
						menuStore.close('relationSuggest'); 

						if (onChange) {
							onChange(message);
						};
					});
				},
			}
		});
	};

	onRelationEdit (e: any, id: string) {
		const rootId = this.getRootId();
		const allowed = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		const relation = dbStore.getRelationById(id);
		
		menuStore.open('blockRelationEdit', { 
			element: `#page .section.relation #item-${id}`,
			offsetX: 32,
			data: {
				rootId,
				relationId: id,
				readonly: !allowed,
				ref: 'type',
				addCommand: (rootId: string, blockId: string, relation: any, onChange?: (relation: any) => void) => {
					C.ObjectTypeRelationAdd(rootId, [ relation.relationKey ], () => {
						if (onChange) {
							onChange(relation.relationKey);
						};
					});
				},
				deleteCommand: () => {
					C.ObjectTypeRelationRemove(rootId, [ relation.relationKey ]);
				},
			}
		});
	};

	onLayout (layout: string) {
		const rootId = this.getRootId();

		C.ObjectSetDetails(rootId, [ 
			{ key: 'recommendedLayout', value: Number(layout) || I.ObjectLayout.Page } 
		]);
		analytics.event('ChangeRecommendedLayout', { objectType: rootId, layout: layout });
	};

	onMenu (item: any) {
		if (menuStore.isOpen('dataviewTemplate', item.id)) {
			menuStore.close('dataviewTemplate');
			return;
		};

		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);
		const { defaultTemplateId } = object;
		const template: any = { id: item.id, typeId: rootId };

		if (template.id == Constant.templateId.blank) {
			template.isBlank = true;

			if (!object.defaultTemplateId) {
				template.isDefault = true;
			};
		} else
		if (template.id == defaultTemplateId) {
			template.isDefault = true;
		};

		menuStore.closeAll(Constant.menuIds.dataviewTemplate, () => {
			menuStore.open('dataviewTemplate', {
				menuKey: item.id,
				element: `#item-${item.id} .more`,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Right,
				onOpen: () => $(`#item-${item.id}`).addClass('active'),
				onClose: () => $(`#item-${item.id}`).removeClass('active'),
				data: {
					template,
					onSetDefault: () => {
						UtilObject.setDefaultTemplateId(rootId, template.id);
					},
					onDuplicate: (object: any) => {
						this.templateOpen(object);
					},
					onDelete: () => {
						if (template.isDefault) {
							UtilObject.setDefaultTemplateId(rootId, '');
						};
					}
				}
			});
		});
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match.params.id;
	};

	getSubIdTemplate () {
		return dbStore.getSubId(this.getRootId(), 'templates');
	};

	getSubIdObject () {
		return dbStore.getSubId(this.getRootId(), 'data');
	};

});

export default PageMainType;
