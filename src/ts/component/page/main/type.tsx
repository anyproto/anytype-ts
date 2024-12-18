import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon, Header, Footer, Loader, ListObjectPreview, ListObject, Deleted, HeadSimple } from 'Component';
import { I, C, S, U, J, focus, Action, analytics, Relation, translate, sidebar } from 'Lib';

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
		this.onMore = this.onMore.bind(this);
		this.onEdit = this.onEdit.bind(this);
	};

	render () {
		const { isLoading, isDeleted } = this.state;

		if (isDeleted) {
			return <Deleted {...this.props} />;
		};

		const rootId = this.getRootId();
		const type = this.getObject();

		if (!type) {
			return null;
		};

		const recommended = Relation.getArrayValue(type.recommendedRelations).map(id => S.Record.getRelationById(id)).filter(it => it).map(it => it.relationKey);

		const subIdTemplate = this.getSubIdTemplate();
		const subIdObject = this.getSubIdObject();

		const showTemplates = this.showTemplates();

		const allowedObject = this.isAllowedObject();
		const allowedTemplate = this.isAllowedTemplate();

		const templates = S.Record.getRecordIds(subIdTemplate, '');
		const totalObject = S.Record.getMeta(subIdObject, '').total;
		const totalTemplate = templates.length + (allowedTemplate ? 1 : 0);

		const isFileType = U.Object.isInFileLayouts(type.recommendedLayout);
		const columns: any[] = [
			{
				relationKey: 'lastModifiedDate', name: translate('commonUpdated'),
				mapper: v => v ? U.Date.dateWithFormat(S.Common.dateFormat, v) : '',
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

				<div className="blocks wrapper">
					<HeadSimple
						{...this.props}
						ref={ref => this.refHead = ref}
						placeholder={translate('defaultNameType')}
						rootId={rootId}
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
										defaultId={type.defaultTemplateId || J.Constant.templateId.blank}
									/>
								</div>
							) : (
								<div className="empty">
									{translate('pageMainTypeNoTemplates')}
								</div>
							)}
						</div>
					) : ''}

					{type.isInstalled ? (
						<div className="section set">
							<div className="title">
								<div className="side left">
									{U.Common.plural(totalObject, translate('pluralObject'))}
									<span className="cnt">{totalObject}</span>
								</div>

								<div className="side right">
									<Icon
										id="button-create"
										className="more withBackground"
										onClick={this.onMore}
									/>

									{allowedObject ? (
										<Icon
											className="plus withBackground"
											tooltip={translate('commonCreateNewObject')}
											onClick={this.onCreate}
										/>
									) : ''}
								</div>
							</div>
							<div className="content">
								<ListObject
									{...this.props}
									sources={[ rootId ]}
									spaceId={type.spaceId}
									subId={subIdObject}
									rootId={rootId}
									columns={columns}
									relationKeys={recommended}
									route={analytics.route.screenType}
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

	close () {
		if (!this.id) {
			return;
		};

		const { isPopup, match } = this.props;
		const close = !(isPopup && (match?.params?.id == this.id));

		if (close) {
			Action.pageClose(this.id, true);
		};
	};

	loadTemplates () {
		const type = this.getObject();
		if (!type) {
			return;
		};

		const template = S.Record.getTemplateType();

		U.Data.searchSubscribe({
			spaceId: type.spaceId,
			subId: this.getSubIdTemplate(),
			filters: [
				{ relationKey: 'targetObjectType', condition: I.FilterCondition.Equal, value: type.id },
				{ relationKey: 'type', condition: I.FilterCondition.Equal, value: template.id },
			],
			sorts: [
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
			],
			keys: [ 'id' ],
			ignoreDeleted: true,
		});
	};

	onTemplateAdd () {
		const type = this.getObject();
		if (!type) {
			return;
		};

		const details: any = {
			targetObjectType: type.id,
			layout: type.recommendedLayout,
		};

		C.ObjectCreate(details, [ I.ObjectFlag.DeleteEmpty ], '', J.Constant.typeKey.template, S.Common.space, message => {
			if (message.error.code) {
				return;
			};

			focus.clear(true);
			analytics.event('CreateTemplate', { objectType: type.id, route: analytics.route.store });

			this.templateOpen(message.details);
		});
	};

	templateOpen (object: any) {
		U.Object.openConfig(object, {
			onClose: () => $(window).trigger(`updatePreviewObject.${object.id}`)
		});
	};

	showTemplates (): boolean {
		const type = this.getObject();
		if (!type) {
			return false;
		};

		return !U.Object.getLayoutsWithoutTemplates().includes(type.recommendedLayout) && (type.uniqueKey != J.Constant.typeKey.template);
	};

	isAllowedTemplate (): boolean {
		const type = this.getObject();

		return type?.isInstalled && this.isAllowedObject() && this.showTemplates();
	};

	isAllowedObject (): boolean {
		const type = this.getObject();

		if (!type || !type.isInstalled) {
			return false;
		};

		const canWrite = U.Space.canMyParticipantWrite();
		if (!canWrite) {
			return false;
		};

		const layout = type.recommendedLayout;

		let ret = (
			U.Object.isInPageLayouts(layout) ||
			U.Object.isInSetLayouts(layout) ||
			U.Object.isBookmarkLayout(layout) ||
			U.Object.isChatLayout(layout)
		);

		if (type.uniqueKey == J.Constant.typeKey.template) {
			ret = false;
		};

		return ret;
	};

	onCreate () {
		const type = this.getObject();
		if (!type) {
			return;
		};

		if (U.Object.isBookmarkLayout(type.recommendedLayout)) {
			this.onBookmarkAdd();
		} else {
			this.onObjectAdd();
		};
	};

	onMore () {
		const options = [
			{ id: 'set', name: translate('pageMainTypeNewSetOfObjects') }
		];

		S.Menu.open('select', {
			element: `#button-create`,
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			data: {
				options,
				onSelect: (e: any, item: any) => {
					switch (item.id) {

						case 'set':
							this.onSetAdd();
							break;
					};
				},
			},
		});
	};

	onEdit () {
		const { isPopup } = this.props;
		const showSidebarRight = S.Common.getShowSidebarRight(isPopup);
		const rootId = this.getRootId();

		sidebar.rightPanelToggle(true, isPopup, 'type', { rootId });
	};

	onObjectAdd () {
		const type = this.getObject();
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
		const type = this.getObject();
		if (!type) {
			return;
		};

		const details = {
			name: U.Common.sprintf(translate('commonSetName'), type.name),
			iconEmoji: type.iconEmoji,
		};

		C.ObjectCreateSet([ type.id ], details, '', S.Common.space, (message: any) => {
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

		const type = this.getObject();
		if (!type) {
			return;
		};

		const { defaultTemplateId } = type;
		const template: any = { id: item.id, typeId: type.id };

		if (template.id == J.Constant.templateId.blank) {
			template.isBlank = true;

			if (!defaultTemplateId) {
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
					typeId: type.id,
					templateId: defaultTemplateId,
					route: analytics.route.type,
					onSetDefault: () => {
						U.Object.setDefaultTemplateId(type.id, template.id);
					},
					onDuplicate: (object: any) => {
						this.templateOpen(object);
					},
					onArchive: () => {
						if (template.isDefault) {
							U.Object.setDefaultTemplateId(type.id, J.Constant.templateId.blank);
						};
					}
				}
			});
		});
	};

	getRootId () {
		const { rootId, match } = this.props;
		return rootId ? rootId : match?.params?.id;
	};

	getObject () {
		const rootId = this.getRootId();
		return S.Detail.get(rootId, rootId, U.Data.typeRelationKeys());
	};

	getSubIdTemplate () {
		return S.Record.getSubId(this.getRootId(), 'templates');
	};

	getSubIdObject () {
		return S.Record.getSubId(this.getRootId(), 'data');
	};

});

export default PageMainType;
