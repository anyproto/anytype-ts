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

const SidebarSettingsIndex = observer(class SidebarSettingsIndex extends React.Component<Props, {}> {

	node: any = null;
	cache: any = {};

	render () {
		const space = U.Space.getSpaceview();
		const { membership } = S.Auth;
		const profile = U.Space.getProfile();
		const participant = U.Space.getParticipant() || profile;
		const param = keyboard.getMatch().params;
		const isSpace = this.props.page == 'settingsSpace';
		const items = this.getItems();

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
				if (![ 'types', 'relations' ].includes(item.id)) {
					icon = <Icon className={`settings-${item.icon || item.id}`} />;
				};
				name = item.name;
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
							<div className="head" onClick={() => U.Space.openDashboard()}>
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
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: i => this.getRowHeight(items[i]),
			keyMapper: i => (items[i] || {}).id,
		});
	};

	getSections (): any[] {
		return this.props.page == 'settingsSpace' ? this.getSpaceSettings() : this.getAppSettings();
	};

	getSpaceSettings () {
		const canWrite = U.Space.canMyParticipantWrite();
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

		return [
			{
				id: 'common', name: translate('commonPreferences'),
				children: [
					{ id: 'spaceIndex', icon: 'space', name: translate('pageSettingsSpaceGeneral') },
					{ id: 'spaceShare', icon: 'members', name: translate('commonMembers') },
					{ id: 'spaceStorageManager', icon: 'storage', name: translate('pageSettingsSpaceRemoteStorage') },
				],
			},
			{ id: 'integrations', name: translate('pageSettingsSpaceIntegrations'), children: importExport },
			{ id: 'contentModel', name: translate('pageSettingsSpaceManageContent'), children: [
					{ id: 'types', name: U.Common.plural(10, translate('pluralObjectType')) },
					{ id: 'relations', name: U.Common.plural(10, translate('pluralProperty')) },
				],
			},
		];
	};

	getAppSettings () {
		const settingsVault = [
			{ id: 'spaceList', name: translate('popupSettingsSpacesListTitle'), icon: 'spaces' },
			{ id: 'dataIndex', name: translate('popupSettingsDataManagementTitle'), icon: 'storage', subPages: [ 'dataPublish', 'delete' ] },
			{ id: 'phrase', name: translate('popupSettingsPhraseTitle') },
		];

		if (this.withMembership()) {
			settingsVault.push({ id: 'membership', icon: 'membership', name: translate('popupSettingsMembershipTitle1') });
		};

		return [
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
	};

	getItems () {
		const sections = this.getSections();

		let items: any[] = [];

		sections.forEach((section, idx) => {
			if (section.name) {
				const item: any = { id: section.id, name: section.name, isSection: true };

				if (idx == 0) {
					item.isFirst = true;
				};

				items.push(item);
			};

			let children = section.children ? section.children : [];

			items = items.concat(children);
		});

		return items;
	};

	getRowHeight (item: any) {
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
		if ([ 'types', 'relations' ].includes(item.id)) {
			sidebar.leftPanelSetState({ page: item.id, });
			return;
		};

		let param = {
			id: item.id,
			layout: I.ObjectLayout.Settings,
		};

		U.Object.openAuto(param);
	};

	onContext (item) {
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

});

export default SidebarSettingsIndex
