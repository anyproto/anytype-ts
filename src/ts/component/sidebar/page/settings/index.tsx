import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { Icon, IconObject, Label } from 'Component';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import * as I from 'Interface';

const LIMIT = 30;
const HEIGHT_ITEM = 28;
const HEIGHT_SECTION = 38;
const HEIGHT_SECTION_FIRST = 28;
const HEIGHT_ACCOUNT = 56;
const HEIGHT_DIV = 12;

const SidebarPageSettingsIndex = forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { page } = props;
	const { data } = S.Membership;
	const product = data?.getTopProduct();
	const { space, isOnline } = S.Common;
	const [ activeId, setActiveId ] = useState('');
	const profile = U.Space.getProfile();
	const participant = U.Space.getParticipant() || profile;
	const param = keyboard.getMatch().params;
	const currentId = activeId || param.id;
	const isSpace = page == 'settingsSpace';
	const spaceview = U.Space.getSpaceview();
	const canWrite = U.Space.canMyParticipantWrite();
	const withMembership = isOnline && U.Data.isAnytypeNetwork();
	const listRef = useRef(null);
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
		const map = U.Menu.settingsSectionsMap();
		const { notSyncedCounter } = S.Auth.getSyncStatus();
		const importExport = [
			{ id: 'exportIndex', iconParam: { name: 'menu/action/download' }, subPages: [ 'exportProtobuf', 'exportMarkdown' ] },
		];

		if (canWrite) {
			importExport.unshift({ id: 'importIndex', iconParam: { name: 'menu/action/import' }, subPages: [ 'importNotion', 'importNotionWarning', 'importCsv' ] });
		};

		const isOwner = U.Space.isMyOwner();
		const leaveOrRemove = !spaceview.isPersonal ? {
			id: 'remove',
			iconParam: isOwner ? { name: 'menu/action/remove', color: 'destructive' } : { name: 'menu/action/leave', color: 'destructive' },
			name: isOwner ? translate('pageSettingsSpaceDeleteSpace') : translate('commonLeaveSpace'),
			color: 'destructive',
		} : null;

		return [
			{
				id: 'common', name: translate('commonPreferences'), children: [
					{ id: 'spaceIndex', iconParam: { name: 'settings/space/space' } },
					spaceview.isPersonal ? null : { id: 'spaceShare', iconParam: { name: 'menu/action/members' } },
					spaceview.isOneToOne ? null : { id: 'spaceNotifications', iconParam: { name: 'settings/pushOn' } },
					{ id: 'spaceStorage', iconParam: { name: 'settings/storage' }, alert: notSyncedCounter },
					{ id: 'archive', iconParam: { name: 'common/bin' } },
				],
			},
			{ id: 'contentModel', name: translate('pageSettingsSpaceManageContent'), children: [
					{ id: 'types', iconParam: { name: 'settings/type' } },
					{ id: 'relations', iconParam: { name: 'settings/relation' } },
				],
			},
			{ id: 'integrations', name: translate('pageSettingsSpaceIntegrations'), children: importExport },
			leaveOrRemove ? { id: 'delete', isDiv: true, children: [ leaveOrRemove ] } : null,
		].filter(it => it).map(s => {
			s.children = s.children.filter(it => it).map((c: any) => {
				c.name = map[c.id] || c.name;
				return c;
			});
			return s;
		});
	};

	const getAppSettings = () => {
		const map = U.Menu.settingsSectionsMap();

		return [
			{ 
				id: 'account', children: [ 
					{ id: 'account' },
				],
			},
			{
				id: 'basicSettings', name: translate('popupSettingsApplicationTitle'), children: [
					{ id: 'personal' },
					{ id: 'language' },
					{ id: 'pinIndex', iconParam: { name: 'settings/pin' }, subPages: [ 'pinSelect', 'pinConfirm' ] },
				],
			},
			{
				id: 'vaultSettings', name: translate('popupSettingsAccountAndKeyTitle'), children: [
					{ id: 'phrase', subPages: [ 'delete' ] },
					withMembership ? { id: 'membership', iconParam: { name: 'settings/membership' } } : null,
				],
			},
			{
				id: 'dataManagement', name: translate('popupSettingsDataManagementTitle'), children: [
					{ id: 'dataIndex', iconParam: { name: 'settings/storage' } },
					{ id: 'spaceList', iconParam: { name: 'settings/spaces' } },
					{ id: 'dataPublish', iconParam: { name: 'settings/sites' } },
					{ id: 'api', iconParam: { name: 'settings/api' } },
				],
			},
		].map(s => {
			s.children = s.children.filter(it => it).map((c: any) => {
				c.name = map[c.id];
				return c;
			});
			return s;
		});
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
		if (item.id == 'remove') {
			Action.removeSpace(S.Common.space, analytics.route.settings);
		} else
		if ([ 'types', 'relations' ].includes(item.id)) {
			S.Common.setLeftSidebarState('vault', `settings/${item.id}`);
		} else {
			setActiveId(item.id);
			Action.openSettings(item.id, analytics.route.settings);
		};
	};

	const onBack = () => {
		if (space) {
			U.Space.openDashboard();
			S.Common.setLeftSidebarState('vault', 'widget');
		} else {
			U.Router.go('/main/void/select', { replace: true });
		};
	};

	const rowRenderer = ({ index, key, parent, style }) => {
		const item = items[index];

		let content = null;

		if (item.isSection) {
			const cn = [ 'itemSection' ];

			if (item.isFirst) {
				cn.push('isFirst');
			};

			content = (
				<div style={style} className={cn.join(' ')}>
					<div className="name">{item.name}</div>
				</div>
			);
		} else 
		if (item.isDiv) {
			content = <div style={style} />;
		} else {
			const cn = [ 'item' ];
			const ccn = [ 'caption' ];

			let icon = null;
			let name = null;
			let caption = '';

			if (item.id == currentId || (item.subPages && item.subPages.includes(currentId))) {
				cn.push('active');
			};

			if (item.color) {
				cn.push(`textColor-${item.color}`);
			};

			if (item.id == 'account') {
				if ('index' == currentId) {
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
				if (item.iconParam) {
					icon = <Icon {...item.iconParam} className={`settings-${item.icon || item.id}`} />;
				} else {
					const iconKey = item.icon || item.id;
					const iconNameMap = {
						space: 'settings/overview',
					};

					icon = <Icon name={iconNameMap[iconKey] || `settings/${iconKey}`} className={`settings-${iconKey}`} />;
				};
				name = item.name;
			};

			if (item.id == 'membership') {
				if (!product || product.isIntro) {
					caption = translate(`commonJoin`);
					ccn.push('join');
				} else {
					caption = product.name;
				};
			} else
			if (item.alert) {
				caption = item.alert;
				ccn.push('alert');
			};

			content = (
				<div
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={() => onClick(item)}
					style={style}
				>
					{icon}
					<div className="name">{name}</div>
					{caption ? <div className={ccn.join(' ')}>{caption}</div> : ''}
				</div>
			);
		};

		return (
			<CellMeasurer
				key={key}
				parent={parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={index}
			>
				{content}
			</CellMeasurer>
		);
	};

	const items = getItems();

	useEffect(() => {
		listRef.current?.recomputeRowHeights(0);
	});

	return (
		<>
			<div className="head">
				<div className="side left">
					<Icon name="common/back" className="back" withBackground={true} onClick={onBack} />
				</div>
				<div className="side center" />
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
											ref={listRef}
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
							<Icon name="header/logout" />
							{translate('commonLogout')}
						</div>
					) : ''}
				</div>
			</div>
		</>
	);

});

export default SidebarPageSettingsIndex;