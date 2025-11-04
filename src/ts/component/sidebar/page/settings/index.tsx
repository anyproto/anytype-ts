import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { I, keyboard, S, translate, U, Onboarding, Action, analytics, sidebar } from 'Lib';
import { Icon, IconObject, Label } from 'Component';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

const LIMIT = 30;
const HEIGHT_ITEM = 28;
const HEIGHT_SECTION = 38;
const HEIGHT_SECTION_FIRST = 28;
const HEIGHT_ACCOUNT = 56;
const HEIGHT_DIV = 12;

const SidebarPageSettingsIndex = observer(forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { page } = props;
	const { membership } = S.Auth;
	const { space, isOnline } = S.Common;
	const [ dummy, setDummy ] = useState(0);
	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const param = keyboard.getMatch().params;
	const isSpace = page == 'settingsSpace';
	const spaceview = U.Space.getSpaceview();
	const canWrite = U.Space.canMyParticipantWrite();
	const withMembership = isOnline && U.Data.isAnytypeNetwork();
	const cache = useRef(new CellMeasurerCache({ fixedHeight: true, defaultHeight: HEIGHT_ITEM }));

	useEffect(() => {
		if (!isSpace) {
			Onboarding.start('membership', false);
		};
	}, []);

	const getSections = (): any[] => {
		return isSpace ? getSpaceSettings() : getAppSettings();
	};

	const getSpaceSettings = () => {
		const { error, notSyncedCounter } = S.Auth.getSyncStatus();
		
		const members = U.Space.getParticipantsList([ I.ParticipantStatus.Joining, I.ParticipantStatus.Active ]);
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
					spaceview.isPersonal ? null : { id: 'spaceShare', icon: 'members', name: members.length > 1 ? translate('commonMembers') : translate('pageSettingsSpaceIndexInviteMembers') },
					{ id: 'spaceNotifications', icon: 'notifications', name: translate('commonNotifications') },
					{ id: 'spaceStorage', icon: 'storage', name: translate('pageSettingsSpaceRemoteStorage'), alert: notSyncedCounter },
					{ id: 'archive', icon: 'bin', name: translate('commonBin') },
				].filter(it => it),
			},
			{ id: 'contentModel', name: translate('pageSettingsSpaceManageContent'), children: [
					{ id: 'types', icon: 'type', name: U.Common.plural(10, translate('pluralObjectType')) },
					{ id: 'relations', icon: 'relation', name: U.Common.plural(10, translate('pluralProperty')) },
				],
			},
			{ id: 'integrations', name: translate('pageSettingsSpaceIntegrations'), children: importExport },
		];
	};

	const getAppSettings = () => {
		return [
			{ id: 'account', children: [ { id: 'account', name: translate('popupSettingsProfileTitle') } ] },
			{
				id: 'basicSettings', name: translate('popupSettingsApplicationTitle'), children: [
					{ id: 'personal', name: translate('popupSettingsPersonalTitle') },
					{ id: 'language', name: translate('pageSettingsLanguageTitle') },
					{ id: 'pinIndex', name: translate('popupSettingsPinTitle'), icon: 'pin', subPages: [ 'pinSelect', 'pinConfirm' ] },
				],
			},
			{
				id: 'vaultSettings', name: translate('popupSettingsAccountAndKeyTitle'), children: [
					{ id: 'phrase', name: translate('popupSettingsPhraseTitle'), subPages: [ 'delete' ] },
					withMembership ? { id: 'membership', icon: 'membership', name: translate('popupSettingsMembershipTitle1') } : null,
				].filter(it => it),
			},
			{
				id: 'dataManagement', name: translate('popupSettingsDataManagementTitle'), children: [
					{ id: 'dataIndex', name: translate('popupSettingsLocalStorageTitle'), icon: 'storage' },
					{ id: 'spaceList', name: translate('popupSettingsSpacesListTitle'), icon: 'spaces' },
					{ id: 'dataPublish', name: translate('popupSettingsDataManagementDataPublishTitle'), icon: 'sites' },
					{ id: 'api', name: translate('popupSettingsApiTitle'), icon: 'api' },
				],
			},
		];
	};

	const getItems = () => {
		const sections = getSections();

		let items: any[] = [];

		sections.forEach((section, idx) => {
			if (section.name) {
				items.push({ 
					id: section.id, 
					name: section.name, 
					isSection: true, 
					isFirst: idx === 0,
				});
			} else 
			if (section.isDiv) {
				items.push({ isDiv: true });
			};

			items = items.concat(section.children ? section.children : []);
		});

		return items;
	};

	const getRowHeight = (item: any) => {
		if (item.isDiv) {
			return HEIGHT_DIV;
		};
		if (item.isSection) {
			return item.isFirst ? HEIGHT_SECTION_FIRST : HEIGHT_SECTION;
		};
		if (item.id == 'account') {
			return HEIGHT_ACCOUNT;
		};
		return HEIGHT_ITEM;
	};

	const onClick = (item) => {
		if ([ 'types', 'relations' ].includes(item.id)) {
			S.Common.setLeftSidebarState('vault', `settings/${item.id}`);
		} else {
			Action.openSettings(item.id, analytics.route.settings);
			setDummy(dummy + 1);
		};
	};

	const onBack = () => {
		if (space) {
			U.Space.openDashboard();
			S.Common.setLeftSidebarState('vault', 'widget');
		} else {
			sidebar.leftPanelSubPageClose(true);
		};
	};

	const ItemSection = (item: any) => {
		const cn = [ 'itemSection' ];

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

		if (item.isDiv) {
			return <div />;
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
				name = (
					<>
						<Label className="userName" text={participant.name} />
						{participant.globalName ? <Label className="anyName" text={participant.globalName} /> : ''}
					</>
				);
				icon = (
					<IconObject 
						object={{ ...participant, name: participant.globalName || participant.name }} 
						size={40} 
						iconSize={40} 
					/>
				);
			};

			cn.push('itemAccount');
		} else {
			icon = <Icon className={`settings-${item.icon || item.id}`} />;
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

		if (item.alert) {
			caption = <div className="caption alert">{item.alert}</div>;
		};

		return (
			<div
				id={`item-${item.id}`}
				className={cn.join(' ')}
				onClick={() => onClick(item)}
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
			cache={cache.current}
			columnIndex={0}
			rowIndex={index}
		>
			<div className="row" style={style}>
				<Item {...items[index]} />
			</div>
		</CellMeasurer>
	);

	const items = getItems();

	return (
		<>
			<div className="head">
				<div className="side left">
					<Icon className="back withBackground" onClick={onBack} />
				</div>
				<div className="side center" />
			</div>
			
			<div className="subHead">
				<div className="side center">
					<div className="name">{translate('commonSettings')}</div>
				</div>
			</div>

			<div id="body" className="body">
				<div className="list">
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
											deferredMeasurmentCache={cache.current}
											rowCount={items.length}
											rowHeight={({ index }) => getRowHeight(items[index])}
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
		</>
	);

}));

export default SidebarPageSettingsIndex;
