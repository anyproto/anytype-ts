import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Header, Footer, Loader, ListObjectPreview, ListObject, Select, Deleted } from 'Component';
import { I, C, UtilData, UtilObject, UtilMenu, UtilCommon, focus, Action, analytics, Relation, translate, UtilDate, UtilRouter, UtilSpace } from 'Lib';
import { commonStore, detailStore, dbStore, menuStore, blockStore } from 'Store';
import Controls from 'Component/page/elements/head/controls';
import HeadSimple from 'Component/page/elements/head/simple';
const Constant = require('json/constant.json');
const Errors = require('json/error.json');

interface State {
	isLoading: boolean;
	isDeleted: boolean;
};

const PageMainType = observer(class PageMainType extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	id = '';
	refHeader: any = null;
	refHead: any = null;
	refControls: any = null;
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

		const { config } = commonStore;
		const rootId = this.getRootId();
		const check = UtilData.checkDetails(rootId);
		const object = detailStore.get(rootId, rootId);
		const subIdTemplate = this.getSubIdTemplate();
		const templates = dbStore.getRecordIds(subIdTemplate, '');
		const canWrite = UtilSpace.canMyParticipantWrite();

		const layout: any = UtilMenu.getLayouts().find(it => it.id == object.recommendedLayout) || {};
		const showTemplates = !UtilObject.getLayoutsWithoutTemplates().includes(object.recommendedLayout);
		const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);

		const allowedObject = object.isInstalled && UtilObject.getPageLayouts().includes(object.recommendedLayout);
		const allowedDetails = object.isInstalled && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const allowedRelation = object.isInstalled && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		const allowedTemplate = object.isInstalled && allowedObject && showTemplates && canWrite;
		const allowedLayout = object.recommendedLayout != I.ObjectLayout.Bookmark;
		
		const subIdObject = this.getSubIdObject();
		const totalObject = dbStore.getMeta(subIdObject, '').total;
		const totalTemplate = templates.length + (allowedTemplate ? 1 : 0);
		const filtersObject: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: this.getSpaceId() },
		];

		if (!recommendedRelations.includes('rel-description')) {
			recommendedRelations.push('rel-description');
		};

		const relations = recommendedRelations.map(id => dbStore.getRelationById(id)).filter(it => {
			if (!it) {
				return false;
			};
			if (Relation.systemKeysWithoutUser().includes(it.relationKey)) {
				return false;
			};
			return config.debug.hiddenObject ? true : !it.isHidden;
		});

		const isFileType = UtilObject.isFileLayout(object.recommendedLayout);
		const columns: any[] = [
			{ 
				relationKey: 'lastModifiedDate', name: translate('commonUpdated'),
				mapper: (v: any) => v ? UtilDate.date(UtilDate.dateFormat(I.DateFormat.MonthAbbrBeforeDay), v) : '',
			},
		];

		if (!isFileType) {
			columns.push({ relationKey: 'creator', name: translate('commonOwner'), isObject: true });
		};

		const ItemRelation = (item: any) => (
			<div id={'item-' + item.id} className={[ 'item', (item.isHidden ? 'isHidden' : ''), 'canEdit' ].join(' ')}>
				<div className="clickable" onClick={e => this.onRelationEdit(e, item.id)}>
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
				<Header 
					{...this.props} 
					component="mainObject" 
					ref={ref => this.refHeader = ref} 
					rootId={rootId} 
				/>

				{isLoading ? <Loader id="loader" /> : ''}

				<div className={[ 'blocks', 'wrapper', check.className ].join(' ')}>
					<Controls ref={ref => this.refControls = ref} key="editorControls" {...this.props} rootId={rootId} resize={() => {}} />
					<HeadSimple 
						{...this.props} 
						ref={ref => this.refHead = ref} 
						placeholder={translate('defaultNameType')} 
						rootId={rootId} onCreate={this.onCreate} 
					/>

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
										getItems={() => dbStore.getRecords(subIdTemplate, [])}
										canAdd={allowedTemplate}
										onAdd={this.onTemplateAdd}
										onMenu={allowedTemplate ? (e: any, item: any) => this.onMenu(item) : null}
										onClick={(e: any, item: any) => this.templateOpen(item)}
										withBlank={true}
										blankId={Constant.templateId.blank}
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

					{object.isInstalled ? (
						<div className="section set">
							<div className="title">{totalObject} {UtilCommon.plural(totalObject, translate('pluralObject'))}</div>
							<div className="content">
								<ListObject 
									{...this.props} 
									sources={[ rootId ]} 
									subId={subIdObject} 
									rootId={rootId} 
									columns={columns} 
									filters={filtersObject} 
								/>
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

		this.close();
		this.id = rootId;
		this.setState({ isLoading: true });

		C.ObjectOpen(rootId, '', UtilRouter.getRouteSpaceId(), (message: any) => {
			if (!UtilCommon.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = detailStore.get(rootId, rootId, []);
			if (object.isDeleted) {
				this.setState({ isDeleted: true, isLoading: false });
				return;
			};

			this.refHeader?.forceUpdate();
			this.refHead?.forceUpdate();
			this.refControls?.forceUpdate();			
			this.setState({ isLoading: false });
			this.loadTemplates();
		});
	};

	loadTemplates () {
		const rootId = this.getRootId();

		UtilData.searchSubscribe({
			subId: this.getSubIdTemplate(),
			filters: [
				{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: this.getSpaceId() },
				{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.Equal, value: rootId },
			],
			sorts: [
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			],
			keys: [ 'id' ],
			ignoreWorkspace: true,
			ignoreDeleted: true,
		});
	};

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup, match } = this.props;
		
		let close = true;
		if (isPopup && (match.params.id == this.id)) {
			close = false;
		};

		if (close) {
			Action.pageClose(this.id, true);
		};
	};

	onTemplateAdd () {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);
		const details: any = { 
			targetObjectType: rootId,
			layout: object.recommendedLayout,
		};

		C.ObjectCreate(details, [], '', Constant.typeKey.template, commonStore.space, (message) => {
			if (message.error.code) {
				return;
			};

			focus.clear(true);
			analytics.event('CreateTemplate', { objectType: rootId, route: analytics.route.store });

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
		const type = dbStore.getTypeById(rootId);
		if (!type) {
			return;
		};

		const isSetLayout = UtilObject.isSetLayout(type.recommendedLayout);
		const allowedObject = UtilObject.getPageLayouts().includes(type.recommendedLayout) || isSetLayout;
		const options = [];

		if (allowedObject) {
			options.push({ id: 'object', name: translate('commonNewObject') });
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
							if (type.recommendedLayout == I.ObjectLayout.Bookmark) {
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
		const type = dbStore.getTypeById(rootId);

		if (!type) {
			return;
		};
		
		const details: any = {};

		if (UtilObject.isSetLayout(type.recommendedLayout)) {
			details.layout = type.recommendedLayout;
		};

		C.ObjectCreate(details, [ I.ObjectFlag.SelectTemplate ], type.defaultTemplateId, type.uniqueKey, commonStore.space, (message: any) => {
			if (message.error.code || !message.details) {
				return;
			};

			const object = message.details;

			UtilObject.openPopup(object);
			analytics.createObject(object.type, object.layout, analytics.route.type, message.middleTime);
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
			name: UtilCommon.sprintf(translate('commonSetName'), object.name),
			iconEmoji: object.iconEmoji,
		};

		C.ObjectCreateSet([ rootId ], details, '', commonStore.space, (message: any) => {
			if (!message.error.code) {
				focus.clear(true);
				UtilObject.openPopup(message.details);
			};
		});
	};

	onRelationAdd (e: any) {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);
		const skipSystemKeys = [ 'tag', 'description', 'source' ];
		const recommendedKeys = object.recommendedRelations.map(id => dbStore.getRelationById(id)).map(it => it && it.relationKey);
		const systemKeys = Relation.systemKeys().filter(it => !skipSystemKeys.includes(it));

		menuStore.open('relationSuggest', { 
			element: '#page .section.relation #item-add',
			offsetX: 32,
			data: {
				filter: '',
				rootId,
				ref: 'type',
				menuIdEdit: 'blockRelationEdit',
				skipKeys: recommendedKeys.concat(systemKeys),
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

		C.ObjectListSetDetails([ rootId ], [ 
			{ key: 'recommendedLayout', value: Number(layout) || I.ObjectLayout.Page } 
		]);
		analytics.event('ChangeRecommendedLayout', { objectType: rootId, layout: layout });
	};

	onMenu (item: any) {
		if (menuStore.isOpen('dataviewTemplateContext', item.id)) {
			menuStore.close('dataviewTemplateContext');
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
			menuStore.open('dataviewTemplateContext', {
				menuKey: item.id,
				element: `#item-more-${item.id}`,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Right,
				onOpen: () => $(`#item-${item.id}`).addClass('active'),
				onClose: () => $(`#item-${item.id}`).removeClass('active'),
				data: {
					template,
					typeId: rootId,
					templateId: defaultTemplateId,
					route: analytics.route.type,
					onSetDefault: () => {
						UtilObject.setDefaultTemplateId(rootId, template.id);
					},
					onDuplicate: (object: any) => {
						this.templateOpen(object);
					},
					onArchive: () => {
						if (template.isDefault) {
							UtilObject.setDefaultTemplateId(rootId, Constant.templateId.blank);
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

	getSpaceId () {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId, [ 'spaceId' ], true);

		return object.spaceId;
	};

	getSubIdTemplate () {
		return dbStore.getSubId(this.getRootId(), 'templates');
	};

	getSubIdObject () {
		return dbStore.getSubId(this.getRootId(), 'data');
	};

});

export default PageMainType;
