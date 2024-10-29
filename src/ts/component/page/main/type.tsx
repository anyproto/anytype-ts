import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Header, Footer, Loader, ListObject, Deleted } from 'Component';
import { I, C, S, U, J, focus, Action, analytics, Relation, translate, sidebar } from 'Lib';

import Controls from 'Component/page/elements/head/controls';
import HeadSimple from 'Component/page/elements/head/simple';
import ListObjectPreview from 'Component/list/objectPreview';

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
		this.onSetAdd = this.onSetAdd.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onEdit = this.onEdit.bind(this);
	};

	render () {
		const { isLoading, isDeleted } = this.state;

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		const rootId = this.getRootId();
		const check = U.Data.checkDetails(rootId);
		const object = S.Detail.get(rootId, rootId, J.Relation.type);

		if (!object) {
			return null;
		};

		const subIdTemplate = this.getSubIdTemplate();
		const templates = S.Record.getRecordIds(subIdTemplate, '');
		const canWrite = U.Space.canMyParticipantWrite();
		const isTemplate = object.uniqueKey == J.Constant.typeKey.template;

		const showTemplates = !U.Object.getLayoutsWithoutTemplates().includes(object.recommendedLayout) && !isTemplate;
		const recommendedRelations = Relation.getArrayValue(object.recommendedRelations);
		const recommendedKeys = recommendedRelations.map(id => S.Record.getRelationById(id)).map(it => it && it.relationKey);

		const allowedObject = object.isInstalled && U.Object.isInPageLayouts(object.recommendedLayout);
		const allowedTemplate = object.isInstalled && allowedObject && showTemplates && canWrite && !isTemplate;
		
		const subIdObject = this.getSubIdObject();
		const totalObject = S.Record.getMeta(subIdObject, '').total;
		const totalTemplate = templates.length + (allowedTemplate ? 1 : 0);

		const isFileType = U.Object.isInFileLayouts(object.recommendedLayout);
		const columns: any[] = [
			{ 
				relationKey: 'lastModifiedDate', name: translate('commonUpdated'),
				mapper: v => v ? U.Date.dateWithFormat(I.DateFormat.MonthAbbrBeforeDay, v) : '',
			},
		];

		if (!isFileType) {
			columns.push({ relationKey: 'creator', name: translate('commonOwner'), isObject: true });
		};

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
						rootId={rootId} 
						onCreate={this.onCreate} 
						onEdit={this.onEdit}
					/>

					{showTemplates ? (
						<div className="section template">
							<div className="title">
								<div className="side left">
									{U.Common.plural(totalTemplate, translate('pluralTemplate'))}
									<span className="cnt">{totalTemplate}</span>
								</div>

								<div className="side right">
									{allowedTemplate ? (
										<Icon 
											className="plus withBackground" 
											tooltip={translate('commonCreateNewTemplate')} 
											onClick={this.onTemplateAdd} 
										/>
									) : ''}
								</div>
							</div>

							{totalTemplate ? (
								<div className="content">
									<ListObjectPreview 
										key="listTemplate"
										ref={ref => this.refListPreview = ref}
										getItems={() => S.Record.getRecords(subIdTemplate, [])}
										canAdd={allowedTemplate}
										onAdd={this.onTemplateAdd}
										onMenu={allowedTemplate ? (e: any, item: any) => this.onMenu(item) : null}
										onClick={(e: any, item: any) => this.templateOpen(item)}
										withBlank={true}
										blankId={J.Constant.templateId.blank}
										defaultId={object.defaultTemplateId || J.Constant.templateId.blank}
									/>
								</div>
							) : (
								<div className="empty">
									{translate('pageMainTypeNoTemplates')}
								</div>
							)}
						</div>
					) : ''}

					{object.isInstalled && !object._empty_ ? (
						<div className="section set">
							<div className="title">
								<div className="side left">
									{U.Common.plural(totalObject, translate('pluralObject'))}
									<span className="cnt">{totalObject}</span>
								</div>

								<div className="side right">
								</div>
							</div>
							<div className="content">
								<ListObject 
									{...this.props} 
									sources={[ rootId ]} 
									spaceId={this.getSpaceId()}
									subId={subIdObject} 
									rootId={rootId} 
									columns={columns} 
									relationKeys={recommendedKeys}
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

		C.ObjectOpen(rootId, '', U.Router.getRouteSpaceId(), (message: any) => {
			if (!U.Common.checkErrorOnOpen(rootId, message.error.code, this)) {
				return;
			};

			const object = S.Detail.get(rootId, rootId, []);
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

		U.Data.searchSubscribe({
			spaceId: this.getSpaceId(),
			subId: this.getSubIdTemplate(),
			filters: [
				{ relationKey: 'targetObjectType', condition: I.FilterCondition.Equal, value: rootId },
			],
			sorts: [
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			],
			keys: [ 'id' ],
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
		const object = S.Detail.get(rootId, rootId);
		const details: any = { 
			targetObjectType: rootId,
			layout: object.recommendedLayout,
		};

		C.ObjectCreate(details, [], '', J.Constant.typeKey.template, S.Common.space, (message) => {
			if (message.error.code) {
				return;
			};

			focus.clear(true);
			analytics.event('CreateTemplate', { objectType: rootId, route: analytics.route.store });

			this.templateOpen(message.details);
		});
	};

	templateOpen (object: any) {
		U.Object.openConfig(object, {
			onClose: () => $(window).trigger(`updatePreviewObject.${object.id}`)
		});
	};

	onCreate () {
		const rootId = this.getRootId();
		const type = S.Record.getTypeById(rootId);
		if (!type) {
			return;
		};

		const layout = type.recommendedLayout;
		const options = [];
		
		let allowedObject = 
			U.Object.isInPageLayouts(layout) || 
			U.Object.isInSetLayouts(layout) || 
			U.Object.isBookmarkLayout(layout) ||
			U.Object.isChatLayout(layout);

		if (type.uniqueKey == J.Constant.typeKey.template) {
			allowedObject = false;
		};

		if (allowedObject) {
			options.push({ id: 'object', name: translate('commonNewObject') });
		};

		options.push({ id: 'set', name: translate('pageMainTypeNewSetOfObjects') });

		S.Menu.open('select', { 
			element: `#button-create`,
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			data: {
				options: options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {
						case 'object':
							if (U.Object.isBookmarkLayout(type.recommendedLayout)) {
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

	onEdit () {
		const rootId = this.getRootId();

		sidebar.rightPanelToggle(!S.Common.showSidebarRight);
		S.Common.getRef('sidebarRight').setState({ page: 'type', rootId });
	};

	onObjectAdd () {
		const rootId = this.getRootId();
		const type = S.Record.getTypeById(rootId);

		if (!type) {
			return;
		};

		const details: any = {};

		if (U.Object.isInSetLayouts(type.recommendedLayout)) {
			details.layout = type.recommendedLayout;
		};

		C.ObjectCreate(details, [ I.ObjectFlag.SelectTemplate ], type.defaultTemplateId, type.uniqueKey, S.Common.space, (message: any) => {
			if (message.error.code || !message.details) {
				return;
			};

			const object = message.details;

			U.Object.openConfig(object);
			analytics.createObject(object.type, object.layout, analytics.route.type, message.middleTime);
		});
	};

	onBookmarkAdd () {
		S.Menu.open('dataviewCreateBookmark', {
			type: I.MenuType.Horizontal,
			element: `#button-create`,
			horizontal: I.MenuDirection.Right,
			data: {
				route: analytics.route.type,
			}
		});
	};

	onSetAdd () {
		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId);
		const details = { 
			name: U.Common.sprintf(translate('commonSetName'), object.name),
			iconEmoji: object.iconEmoji,
		};

		C.ObjectCreateSet([ rootId ], details, '', S.Common.space, (message: any) => {
			if (!message.error.code) {
				focus.clear(true);
				U.Object.openConfig(message.details);
			};
		});
	};

	onMenu (item: any) {
		if (S.Menu.isOpen('dataviewTemplateContext', item.id)) {
			S.Menu.close('dataviewTemplateContext');
			return;
		};

		const rootId = this.getRootId();
		const object = S.Detail.get(rootId, rootId);
		const { defaultTemplateId } = object;
		const template: any = { id: item.id, typeId: rootId };

		if (template.id == J.Constant.templateId.blank) {
			template.isBlank = true;

			if (!object.defaultTemplateId) {
				template.isDefault = true;
			};
		} else
		if (template.id == defaultTemplateId) {
			template.isDefault = true;
		};

		S.Menu.closeAll(J.Menu.dataviewTemplate, () => {
			S.Menu.open('dataviewTemplateContext', {
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
						U.Object.setDefaultTemplateId(rootId, template.id);
					},
					onDuplicate: (object: any) => {
						this.templateOpen(object);
					},
					onArchive: () => {
						if (template.isDefault) {
							U.Object.setDefaultTemplateId(rootId, J.Constant.templateId.blank);
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
		const object = S.Detail.get(rootId, rootId, [ 'spaceId' ], true);

		return object.spaceId;
	};

	getSubIdTemplate () {
		return S.Record.getSubId(this.getRootId(), 'templates');
	};

	getSubIdObject () {
		return S.Record.getSubId(this.getRootId(), 'data');
	};

});

export default PageMainType;