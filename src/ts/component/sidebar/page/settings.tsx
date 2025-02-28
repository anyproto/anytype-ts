import * as React from 'react';
import { observer } from 'mobx-react';
import { analytics, I, J, keyboard, S, sidebar, translate, U } from 'Lib';
import { Icon, IconObject, ObjectName } from 'Component';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends React.Component {
	page: string;
};

const LIMIT = 30;
const HEIGHT_ITEM = 28;
const HEIGHT_SECTION = 38;
const HEIGHT_SECTION_FIRST = 34;
const HEIGHT_ACCOUNT = 56;

const SidebarSettings = observer(class SidebarSettings extends React.Component<Props, {}> {

	node: any = null;
	routeBack: any = null;
	cache: any = {};
	toggle: any = {
		contentModelTypes: false,
		contentModelRelations: false,
	};

	render () {
		const space = U.Space.getSpaceview();
		const { membership } = S.Auth;
		const profile = U.Space.getProfile();
		const participant = U.Space.getParticipant() || profile;
		const pathname = U.Router.getRoute();
		const param = U.Router.getParam(pathname);
		const isSpace = this.props.page == 'settingsSpace';

		const items = this.getItems();

		const onBack = () => {
			if (!this.routeBack || !this.routeBack.pathname) {
				U.Space.openDashboard();
				return;
			};

			U.Router.go(this.routeBack.pathname, {});
		};

		const ItemToggle = (item: any) => {
			const cn = [ 'toggle' ];

			if (this.toggle[item.id]) {
				cn.push('isOpen');
			};

			return (
				<div id={`item-toggle-${item.id}`} className={cn.join(' ')} onClick={() => this.onToggle(item)}>
					<div className="left">
						<Icon className="arrow" />
						{item.name}
					</div>
					<div className="right">
						<Icon className="plus" onClick={e => this.onAdd(e, item)} />
					</div>
				</div>
			);
		};

		const ItemSection = (item: any) => {
			const cn = [ 'section' ];

			if (item.isFirst) {
				cn.push('isFirst');
			};

			return (
				<div className={cn.join(' ')}>
					<div className="name">{item.name}</div>
				</div>
			);
		};

		const Item = (item: any) => {
			if (item.isToggle) {
				return <ItemToggle {...item} />;
			} else
			if (item.isSection) {
				return <ItemSection {...item} />;
			};

			const cn = [ 'item' ];

			let icon = null;
			let name = null;
			let caption = null;

			if (item.id == param.id || (item.subPages && item.subPages.includes(param.id))) {
				cn.push('active');
			};

			if (item.id == 'account') {
				if ('index' == param.id) {
					cn.push('active');
				};

				if (participant) {
					name = participant?.globalName || participant?.name;
					icon = <IconObject object={{ ...participant, name }} size={36} iconSize={36} />;
				};

				cn.push('itemAccount');
			} else {
				icon = <Icon className={`settings-${item.icon || item.id}`} />;
				name = item.name;
			};

			if (U.Object.isTypeOrRelationLayout(item.layout)) {
				cn.push('isTypeOrRelation');

				icon = <IconObject object={item} />;
			};

			if (item.id == 'membership') {
				if (!membership.isNone) {
					const tierItem = U.Data.getMembershipTier(membership.tier);

					caption = <div className="caption">{tierItem.name}</div>;
				} else {
					caption = <div className="caption join">{translate(`commonJoin`)}</div>;
				};
			};

			return (
				<div
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onContextMenu={() => this.onContext(item)}
					onClick={() => this.onClick(item)}
				>
					{icon}

					<div className="name">{name}</div>

					{caption}
				</div>
			);
		};

		const rowRenderer = ({ index, key, parent, style }) => (
			<CellMeasurer
				key={key}
				parent={parent}
				cache={this.cache}
				columnIndex={0}
				rowIndex={index}
			>
				<div className="row" style={style}>
					<Item {...items[index]} />
				</div>
			</CellMeasurer>
		);

		return (
			<div 
				ref={ref => this.node = ref} 
				id="containerSettings" 
				className={isSpace ? 'spaceSettings' : 'appSettings'}
			>
				<div className="head" />

				<div className="body">
					<div className="list">
						{isSpace ? (
							<div className="head" onClick={onBack}>
								<Icon className="back withBackground" />
								<ObjectName object={space} />
							</div>
						) : ''}
						<div className="inner">
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
												width={width}
												height={height}
												deferredMeasurmentCache={this.cache}
												rowCount={items.length}
												rowHeight={({ index }) => this.getRowHeight(items[index])}
												rowRenderer={rowRenderer}
												onRowsRendered={onRowsRendered}
												overscanRowCount={10}
												scrollToAlignment="center"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>
						</div>

						{!isSpace ? (
							<div className="logout" onClick={() => S.Popup.open('logout', {})}>
								<Icon />
								{translate('commonLogout')}
							</div>
						) : ''}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const history = U.Router.history;
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: i => this.getRowHeight(items[i]),
			keyMapper: i => (items[i] || {}).id,
		});

		this.routeBack = history.entries[history.index - 1];
	};

	getSections (): any[] {
		const canWrite = U.Space.canMyParticipantWrite();
		const isSpace = this.props.page == 'settingsSpace';
		const settingsVault = [
			{ id: 'spaceList', name: translate('popupSettingsSpacesListTitle'), icon: 'spaces' },
			{ id: 'dataIndex', name: translate('popupSettingsDataManagementTitle'), icon: 'storage', subPages: [ 'dataPublish', 'delete' ] },
			{ id: 'phrase', name: translate('popupSettingsPhraseTitle') },
		];

		if (this.withMembership()) {
			settingsVault.push({ id: 'membership', icon: 'membership', name: translate('popupSettingsMembershipTitle1') });
		};

		const appSettings = [
			{ id: 'account', children: [ { id: 'account', name: translate('popupSettingsProfileTitle') } ] },
			{
				id: 'basicSettings', name: translate('popupSettingsApplicationTitle'), children: [
					{ id: 'personal', name: translate('popupSettingsPersonalTitle') },
					{ id: 'language', name: translate('pageSettingsLanguageTitle') },
					{ id: 'pinIndex', name: translate('popupSettingsPinTitle'), icon: 'pin', subPages: [ 'pinSelect', 'pinConfirm' ] },
				]
			},
			{ id: 'vaultSettings', name: translate('popupSettingsAccountAndKeyTitle'), children: settingsVault }
		];

		const importExport = [{
			id: 'exportIndex', icon: 'export', name: translate('commonExport'),
			subPages: [ 'exportProtobuf', 'exportMarkdown' ]
		}];

		if (canWrite) {
			importExport.unshift({
				id: 'importIndex', icon: 'import', name: translate('commonImport'),
				subPages: [ 'importNotion', 'importNotionHelp', 'importNotionWarning', 'importCsv' ]
			});
		};

		const spaceSettings = [
			{ id: 'common', name: translate('commonPreferences'), children: [
					{ id: 'spaceIndex', icon: 'space', name: translate('pageSettingsSpaceGeneral') },
					{ id: 'spaceShare', icon: 'members', name: translate('commonMembers') },
					{ id: 'spaceStorageManager', icon: 'storage', name: translate('pageSettingsSpaceRemoteStorage') },
				]
			},
			{ id: 'integrations', name: translate('pageSettingsSpaceIntegrations'), children: importExport },

			{ id: 'contentModel', name: translate('pageSettingsSpaceManageContent'), isLabel: true },
			{ id: 'contentModelTypes', isToggle: true, name: U.Common.plural(10, translate('pluralObjectType')), children: S.Record.getTypes() },
			{ id: 'contentModelRelations', isToggle: true, name: U.Common.plural(10, translate('pluralProperty')), children: S.Record.getRelations() },
		];

		return isSpace ? spaceSettings : appSettings;
	};

	getItems () {
		const sections = this.getSections();

		let items: any[] = [];

		sections.forEach((section, idx) => {
			if (section.name) {
				const item: any = { id: section.id, name: section.name, isSection: true };

				if (section.isToggle) {
					item.isToggle = true;
				};

				if (idx == 0) {
					item.isFirst = true;
				};

				items.push(item);
			};

			let children = section.children ? section.children : [];
			if (section.isToggle && !this.toggle[section.id]) {
				children = [];
			};

			items = items.concat(children);
		});

		return items;
	};

	getRowHeight (item: any) {
		if (item.isToggle) {
			return HEIGHT_ITEM;
		};
		if (item.isSection) {
			return item.isFirst ? HEIGHT_SECTION_FIRST : HEIGHT_SECTION;
		};
		if (item.id == 'account') {
			return HEIGHT_ACCOUNT;
		};
		return HEIGHT_ITEM;
	};

	withMembership () {
		return S.Common.isOnline && U.Data.isAnytypeNetwork();
	};

	onClick (item) {
		let param = {
			id: item.id,
			layout: I.ObjectLayout.Settings, 
		};

		if (U.Object.isTypeOrRelationLayout(item.layout)) {
			param = Object.assign(param, {
				id: 'type',
				_routeParam_: { 
					additional: [ 
						{ key: 'objectId', value: item.id } 
					],
				},
			});
		};

		U.Object.openAuto(param);
	};

	onContext (item) {
		if (!U.Object.isTypeOrRelationLayout(item.layout)) {
			return;
		};

		const { x, y } = keyboard.mouse.page;

		S.Menu.open('objectContext', {
			element: `#containerSettings #item-${item.id}`,
			rect: { width: 0, height: 0, x: x + 4, y },
			data: {
				objectIds: [ item.id ],
				getObject: () => {
					return item;
				},
			}
		});
	};

	onToggle (item) {
		this.toggle[item.id] = !this.toggle[item.id];
		this.forceUpdate();
	};
	
	onAdd (e, item) {
		e.preventDefault();
		e.stopPropagation();

		const isPopup = keyboard.isPopup();

		switch (item.id) {
			case 'contentModelTypes': {
				const type = S.Record.getTypeType();
				const featured = [ 'type', 'tag', 'backlinks' ];
				const recommended = [];
				const mapper = it => S.Record.getRelationByKey(it)?.id;
				const details: any = {
					isNew: true,
					type: type.id,
					layout: I.ObjectLayout.Type,
					recommendedFeaturedRelations: featured.map(mapper).filter(it => it),
					recommendedRelations: recommended.map(mapper).filter(it => it),
				};

				sidebar.rightPanelToggle(true, true, isPopup, 'type', { details });
				break;
			};

			case 'contentModelRelations': {
				const node = $(this.node);
				const width = node.width() - 32;

				S.Menu.open('blockRelationEdit', {
					element: `#containerSettings #item-toggle-${item.id} .plus`,
					offsetY: 4,
					width,
					className: 'fixed',
					classNameWrap: 'fromSidebar',
					horizontal: I.MenuDirection.Right,
				});

				break;
			};	
		};
	};

});

export default SidebarSettings
