import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, Header, Footer, Loader, ListObjectPreview, ListObject, Select, Deleted } from 'Component';
import { I, C, DataUtil, Util, focus, crumbs, Action, analytics } from 'Lib';
import { detailStore, dbStore, menuStore, popupStore, blockStore } from 'Store';

import HeadSimple from 'Component/page/head/simple';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
};

interface State {
	isDeleted: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const Errors = require('json/error.json');

const BLOCK_ID_OBJECT = 'dataview';
const BLOCK_ID_TEMPLATE = 'templates';

const NO_TEMPLATES = [ 
	Constant.typeId.note, 
	Constant.typeId.set, 
	Constant.typeId.bookmark,
].concat(DataUtil.getFileTypes()).concat(DataUtil.getSystemTypes());

const PageMainType = observer(class PageMainType extends React.Component<Props, State> {

	_isMounted: boolean = false;
	id: string = '';
	refHeader: any = null;
	refHead: any = null;
	refListPreview: any = null;
	loading: boolean = false;
	timeout: number = 0;
	page: number = 0;

	state = {
		isDeleted: false,
	};

	constructor (props: any) {
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

		const rootId = this.getRootId();
		const object = Util.objectCopy(detailStore.get(rootId, rootId, [ 'recommendedLayout' ]));
		const subIdTemplate = this.getSubIdTemplate();

		const type = dbStore.getType(rootId);
		const templates = dbStore.getRecords(subIdTemplate, '').map(id => detailStore.get(subIdTemplate, id, []));
		const totalTemplate = dbStore.getMeta(subIdTemplate, '').total;
		const totalObject = dbStore.getMeta(this.getSubIdObject(), '').total;
		const layout: any = DataUtil.menuGetLayouts().find(it => it.id == object.recommendedLayout) || {};
		const showTemplates = !NO_TEMPLATES.includes(rootId);

		const allowedObject = (type.smartblockTypes || []).includes(I.SmartBlockType.Page);
		const allowedDetails = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
		const allowedRelation = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		const allowedTemplate = allowedObject && showTemplates;

		console.log(allowedObject, showTemplates);

		let relations = Util.objectCopy(dbStore.getRelations(rootId, rootId)).sort(DataUtil.sortByHidden);
		relations = relations.filter(it => !Constant.systemRelationKeys.includes(it.relationKey));

		const Relation = (item: any) => (
			<div id={'item-' + item.id} className={[ 'item', (item.isHidden ? 'isHidden' : ''), 'canEdit' ].join(' ')}>
				<div className="clickable" onClick={(e: any) => { this.onRelationEdit(e, item.id); }}>
					<Icon className={[ 'relation', DataUtil.relationClass(item.format) ].join(' ')} />
					<div className="name">{item.name}</div>
				</div>
			</div>
		);

		const ItemAdd = (item: any) => (
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
				<Header component="mainEdit" ref={(ref: any) => { this.refHeader = ref; }} {...this.props} rootId={rootId} />

				<div className="blocks wrapper">
					<HeadSimple ref={(ref: any) => { this.refHead = ref;}} type="type" rootId={rootId} onCreate={this.onCreate} />

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
										ref={(ref: any) => { this.refListPreview = ref; }}
										getItems={() => { return templates; }}
										canAdd={allowedTemplate}
										onAdd={this.onTemplateAdd}
										onClick={(e: any, item: any) => { DataUtil.objectOpenPopup(item); }} 
									/>
								</div>
							) : (
								<div className="empty">
									This object type doesn't have templates
								</div>
							)}
						</div>
					) : ''}

					<div className="section note dn">
						<div className="title">Notes</div>
						<div className="content">People often distinguish between an acquaintance and a friend, holding that the former should be used primarily to refer to someone with whom one is not especially close. Many of the earliest uses of acquaintance were in fact in reference to a person with whom one was very close, but the word is now generally reserved for those who are known only slightly.</div>
					</div>

					<div className="section layout">
						<div className="title">Recommended layout</div>
						<div className="content">
							{allowedDetails ? (
								<Select 
									id="recommendedLayout" 
									value={object.recommendedLayout} 
									options={DataUtil.menuTurnLayouts()} 
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
								<Relation key={i} {...item} />
							))}
							{allowedRelation ? <ItemAdd /> : ''}
						</div>
					</div>

					<div className="section set">
						<div className="title">{totalObject} {Util.cntWord(totalObject, 'object', 'objects')}</div>
						<div className="content">
							<ListObject rootId={rootId} blockId={BLOCK_ID_OBJECT} />
						</div>
					</div>
				</div>

				<Footer component="mainEdit" {...this.props} />
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
					Util.route('/main/index');
				};
				return;
			};

			crumbs.addRecent(rootId);

			this.getDataviewData(BLOCK_ID_TEMPLATE, 0);

			this.loading = false;
			this.forceUpdate();

			if (this.refHeader) {
				this.refHeader.forceUpdate();
			};
			if (this.refHead) {
				this.refHead.forceUpdate();
			};
		});
	};

	getDataviewData (blockId: string, limit: number) {
		const rootId = this.getRootId();
		const views = dbStore.getViews(rootId, blockId);
		const block = blockStore.getLeaf(rootId, blockId);

		if (views.length) {
			const view = views[0];
			const filters = view.filters.concat([
				{ operator: I.FilterOperator.And, relationKey: 'isDeleted', condition: I.FilterCondition.Equal, value: false },
			]);
			DataUtil.searchSubscribe({
				subId: this.getSubIdTemplate(),
				filters,
				sorts: view.sorts,
				keys: [ 'id' ],
				sources: block.content.sources,
			});
		};
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

			const object = detailStore.get(rootId, message.objectId, []);

			focus.clear(true);
			dbStore.recordAdd(rootId, BLOCK_ID_TEMPLATE, object.id, 1);
			analytics.event('CreateTemplate', { objectType: rootId });

			DataUtil.objectOpenPopup(object, {
				onClose: () => {
					if (this.refListPreview) {
						this.refListPreview.updateItem(object.id);
					};
				}
			});
		});
	};

	onCreate () {
		const rootId = this.getRootId();
		const type = dbStore.getType(rootId);
		const allowedObject = (type.smartblockTypes || []).indexOf(I.SmartBlockType.Page) >= 0;
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

		const create = (template: any) => {
			DataUtil.pageCreate('', '', details, I.BlockPosition.Bottom, template?.id, {}, [], (message: any) => {
				DataUtil.objectOpenPopup({ ...details, id: message.targetId });

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
			data: {
				command: (source: string, callBack: (message: any) => void) => {
					C.ObjectCreateBookmark({ source }, callBack);
				}
			},
		});
	};

	onSetAdd () {
		const rootId = this.getRootId();
		const object = detailStore.get(rootId, rootId);

		C.ObjectCreateSet([ rootId ], { name: object.name + ' set', iconEmoji: object.iconEmoji }, '', (message: any) => {
			if (!message.error.code) {
				focus.clear(true);
				DataUtil.objectOpenPopup({ id: message.objectId, layout: I.ObjectLayout.Set });
			};
		});
	};

	onRelationAdd (e: any) {
		const rootId = this.getRootId();
		const relations = dbStore.getRelations(rootId, rootId);

		menuStore.open('relationSuggest', { 
			element: $(e.currentTarget),
			offsetX: 32,
			data: {
				filter: '',
				rootId: rootId,
				ref: 'type',
				menuIdEdit: 'blockRelationEdit',
				skipIds: relations.map(it => it.relationKey),
				addCommand: (rootId: string, blockId: string, relationId: string) => {
					C.ObjectTypeRelationAdd(rootId, [ relationId ], () => { 
						menuStore.close('relationSuggest'); 
					});
				},
			}
		});
	};

	onRelationEdit (e: any, id: string) {
		const rootId = this.getRootId();
		const allowed = blockStore.checkFlags(rootId, rootId, [ I.RestrictionObject.Relation ]);
		
		menuStore.open('blockRelationEdit', { 
			element: $(e.currentTarget),
			horizontal: I.MenuDirection.Center,
			data: {
				rootId: rootId,
				relationId: id,
				readonly: !allowed,
				addCommand: (rootId: string, blockId: string, relationId: string, onChange?: (relation: any) => void) => {
					C.ObjectTypeRelationAdd(rootId, [ relationId ], () => {
						if (onChange) {
							onChange(relationId);
						};
					});
				},
				deleteCommand: () => {
					C.ObjectTypeRelationRemove(rootId, id);
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
		return dbStore.getSubId(this.getRootId(), BLOCK_ID_TEMPLATE);
	};

	getSubIdObject () {
		return dbStore.getSubId(this.getRootId(), BLOCK_ID_OBJECT);
	};

});

export default PageMainType;