import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Header, Footer, Loader, ListObjectPreview, ListObject, Select, Deleted } from 'Component';
import { I, C, DataUtil, ObjectUtil, MenuUtil, Util, focus, Action, analytics, Relation } from 'Lib';
import { commonStore, detailStore, dbStore, menuStore, popupStore, blockStore } from 'Store';
import Controls from 'Component/page/head/controls';
import HeadSimple from 'Component/page/head/simple';
import Constant from 'json/constant.json';
import Errors from 'json/error.json';

interface State {
	isDeleted: boolean;
};

const NO_TEMPLATES = [ 
	Constant.typeId.note, 
	Constant.typeId.set, 
	Constant.typeId.collection,
	Constant.typeId.bookmark,
].concat(ObjectUtil.getFileTypes()).concat(ObjectUtil.getSystemTypes());

const PageMainType = observer(class PageMainType extends React.Component<I.PageComponent, State> {

	_isMounted = false;
	id = '';
	refHeader: any = null;
	refHead: any = null;
	refListPreview: any = null;
	loading = false;
	timeout = 0;
	page = 0;

	state = {
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
		if (this.state.isDeleted) {
			return <Deleted {...this.props} />;
		};

		if (this.loading) {
			return <Loader id="loader" />;
		};

		const { config } = commonStore;
		const rootId = this.getRootId();
		const check = DataUtil.checkDetails(rootId);
		const object = detailStore.get(rootId, rootId);
		const subIdTemplate = this.getSubIdTemplate();

		const templates = dbStore.getRecords(subIdTemplate, '').map(id => detailStore.get(subIdTemplate, id, []));
		const totalTemplate = dbStore.getMeta(subIdTemplate, '').total;
		const totalObject = dbStore.getMeta(this.getSubIdObject(), '').total;
		const layout: any = MenuUtil.getLayouts().find(it => it.id == object.recommendedLayout) || {};
		const showTemplates = !NO_TEMPLATES.includes(rootId);

		const allowedObject = object.isInstalled && ObjectUtil.getPageLayouts().includes(object.recommendedLayout);
		const allowedDetails = object.isInstalled && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const allowedRelation = object.isInstalled && blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		const allowedTemplate = object.isInstalled && allowedObject && showTemplates;

		const relations = (object.recommendedRelations || []).map(id => dbStore.getRelationById(id)).filter(it => {
			if (!it) {
				return false;
			};
			if ([ 'tag', 'description' ].includes(it.relationKey)) {
				return true;
			};
			if (ObjectUtil.getSystemRelationKeys().includes(it.relationKey)) {
				return false;
			};
			return config.debug.ho ? true : !it.isHidden;
		});

		const isFileType = ObjectUtil.isFileType(rootId);
		const columns: any[] = [
			{ 
				relationKey: 'lastModifiedDate', name: 'Updated',  
				mapper: (v: any) => Util.date(DataUtil.dateFormat(I.DateFormat.MonthAbbrBeforeDay), v),
			},
		];

		if (!isFileType) {
			columns.push({ relationKey: 'creator', name: 'Owner', isObject: true });
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
					<div className="name">New</div>
				</div>
				<div className="value" />
			</div>
		);

		return (
			<div>
				<Header component="mainObject" ref={ref => { this.refHeader = ref; }} {...this.props} rootId={rootId} />

				<div className={[ 'blocks', 'wrapper', check.className ].join(' ')}>
					<Controls key="editorControls" {...this.props} rootId={rootId} resize={() => {}} />
					<HeadSimple ref={ref => this.refHead = ref} type="type" rootId={rootId} onCreate={this.onCreate} />

					{showTemplates ? (
						<div className="section template">
							<div className="title">
								{totalTemplate} {Util.cntWord(totalTemplate, 'template', 'templates')}

								{allowedTemplate ? (
									<div className="btn" onClick={this.onTemplateAdd}>
										<Icon className="plus" />New
									</div>
								) : ''}
							</div>

							{totalTemplate ? (
								<div className="content">
									<ListObjectPreview 
										key="listTemplate"
										ref={ref => { this.refListPreview = ref; }}
										getItems={() => templates}
										canAdd={allowedTemplate}
										onAdd={this.onTemplateAdd}
										onClick={(e: any, item: any) => { ObjectUtil.openPopup(item); }} 
									/>
								</div>
							) : (
								<div className="empty">
									This object type doesn&apos;t have templates
								</div>
							)}
						</div>
					) : ''}

					<div className="section note dn">
						<div className="title">Notes</div>
						<div className="content">People often distinguish between an acquaintance and a friend, holding that the former should be used primarily to refer to someone with whom one is not especially close. Many of the earliest uses of acquaintance were in fact in reference to a person with whom one was very close, but the word is now generally reserved for those who are known only slightly.</div>
					</div>

					{allowedObject ? (
						<React.Fragment>
							<div className="section layout">
								<div className="title">Recommended layout</div>
								<div className="content">
									{allowedDetails ? (
										<Select 
											id="recommendedLayout" 
											value={object.recommendedLayout} 
											options={MenuUtil.turnLayouts()} 
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

							<div className="section relation">
								<div className="title">{relations.length} {Util.cntWord(relations.length, 'relation', 'relations')}</div>
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
							<div className="title">{totalObject} {Util.cntWord(totalObject, 'object', 'objects')}</div>
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
		this.loading = true;
		this.forceUpdate();

		C.ObjectOpen(rootId, '', (message: any) => {
			if (message.error.code) {
				if (message.error.code == Errors.Code.NOT_FOUND) {
					this.setState({ isDeleted: true });
				} else {
					ObjectUtil.openHome('route');
				};
				return;
			};

			this.loading = false;
			this.loadTemplates();
			this.forceUpdate();

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

		DataUtil.searchSubscribe({
			subId: this.getSubIdTemplate(),
			filters: [
				{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: [ Constant.storeTypeId.template, Constant.typeId.template ] },
				{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.Equal, value: rootId },
				{ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: object.isInstalled ? workspace : Constant.storeSpaceId },
			],
			sorts: [
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc }
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
		const details: any = { 
			type: Constant.typeId.template, 
			targetObjectType: rootId,
		};

		C.ObjectCreate(details, [], '', (message) => {
			if (message.error.code) {
				return;
			};

			focus.clear(true);
			analytics.event('CreateTemplate', { objectType: rootId });

			ObjectUtil.openPopup(message.details, {
				onClose: () => {
					if (this.refListPreview) {
						this.refListPreview.updateItem(message.objectId);
					};
				}
			});
		});
	};

	onCreate () {
		const rootId = this.getRootId();
		const type = dbStore.getType(rootId);
		const isSetType = ObjectUtil.isSetType(rootId);
		const allowedObject = ObjectUtil.getPageLayouts().includes(type.recommendedLayout) || isSetType;
		const options = [];

		if (allowedObject) {
			options.push({ id: 'object', name: 'New object' });
		};

		options.push({ id: 'set', name: 'New set of objects' });

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
			ObjectUtil.create('', '', details, I.BlockPosition.Bottom, template?.id, {}, [], (message: any) => {
				ObjectUtil.openPopup({ ...details, id: message.targetId });

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

		DataUtil.checkTemplateCnt([ rootId ], (message: any) => {
			if (message.records.length > 1) {
				showMenu();
			} else {
				create(message.records.length ? message.records[0] : '');
			};
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
				ObjectUtil.openPopup(message.details);
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
				skipKeys: recommendedRelations.concat(ObjectUtil.getSystemRelationKeys()),
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

		C.ObjectSetDetails(rootId, [ { key: 'recommendedLayout', value: layout } ]);
		analytics.event('ChangeRecommendedLayout', { objectType: rootId, layout: layout });
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