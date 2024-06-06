import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { MenuItemVertical, Title, Button, Icon, IconObject, ObjectName, Label } from 'Component';
import { C, Action, I, translate, UtilObject, UtilData, UtilSpace, UtilFile, UtilCommon } from 'Lib';
import { menuStore, authStore } from 'Store';
import Constant from 'json/constant.json';

const HEIGHT_SECTION = 26;
const HEIGHT_ITEM = 28;
const LIMIT_HEIGHT = 12;

const MenuSyncStatus = observer(class MenuSyncStatus extends React.Component<I.Menu, {}> {

	cache: any = {};
	items: any[] = [];
	currentInfo = '';

	constructor (props: I.Menu) {
		super(props);

		this.onContextMenu = this.onContextMenu.bind(this);
		this.onPanelIconClick = this.onPanelIconClick.bind(this);
		this.onCloseInfo = this.onCloseInfo.bind(this);
	};

	render () {
		const items = this.getItems();
		const icons = this.getIcons();

		const PanelIcon = (item) => {
			const { id, status } = item;

			return (
				<div id={UtilCommon.toCamelCase([ 'icon', id ].join('-'))} className={[ 'iconWrapper', status ? status : ''].join(' ')} onClick={e => this.onPanelIconClick(e, item)}>
					<Icon className={id} />
				</div>
			);
		};

		const Item = (item: any) => {
			const { syncStatus } = item;
			const icon = this.getClassBySyncStatus(syncStatus);

			return (
				<div
					id={'item-' + item.id}
					className="item sides"
					onContextMenu={e => this.onContextMenu(e, item)}
				>
					<div className="side left">
						<IconObject object={item} size={20} />
						<div className="info">
							<ObjectName object={item} />
							{item.sizeInBytes ? <span className="size">{UtilFile.size(item.sizeInBytes)}</span> : ''}
						</div>
					</div>
					<div className="side right">
						<Icon className={icon} />
						<Icon className="more" onClick={e => this.onContextMenu(e, item)} />
					</div>
				</div>
			);
		};

		const rowRenderer = ({ index, key, style, parent }) => {
			const item = items[index];

			let content = null;
			if (item.isSection) {
				content = <div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={style}>{translate(UtilCommon.toCamelCase([ 'common', item.id ].join('-')))}</div>;
			} else {
				content = (
					<div className="row" style={style}>
						<Item {...item} index={index} />
					</div>
				);
			};

			return (
				<CellMeasurer
					key={key}
					parent={parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={index}
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
			<div className="syncMenuWrapper" onClick={this.onCloseInfo}>
				<div className="syncPanel">
					<Title text={translate('menuSyncStatusTitle')} />

					<div className="icons">
						{icons.map((icon, idx) => <PanelIcon key={idx} {...icon} />)}
					</div>
				</div>

				{this.cache && items.length ? (
					<div className="items">
						<InfiniteLoader
							rowCount={items.length}
							isRowLoaded={({ index }) => !!items[index]}
							threshold={LIMIT_HEIGHT}
							loadMoreRows={() => { return; }}
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
											scrollToAlignment="center"
											overscanRowCount={20}
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount () {
		this.load();
	};

	componentDidUpdate () {
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});
	};

	componentWillUnmount () {
		this.onCloseInfo();
	};

	onContextMenu (e, item) {
		const { id } = item;
		const { param } = this.props;
		const { classNameWrap } = param;
		const options = [
			{ id: 'open', name: translate('commonOpen') },
			{ id: 'archive', name: translate('commonDeleteImmediately'), isRed: true }
		];
		const itemNode = $(`#item-${id}`);

		itemNode.addClass('selected');
		menuStore.open('select', {
			classNameWrap,
			className: 'menuSyncStatusContext',
			element: itemNode.find('.more'),
			offsetY: 4,
			onClose: () => {
				itemNode.removeClass('selected');
			},
			data: {
				options,
				onSelect: (e, option) => {
					switch (option.id) {
						case 'open': {
							UtilObject.openAuto(item);
							break;
						};
						case 'archive': {
							Action.delete([ id ], 'syncStatus');
							break;
						};
					};
				}
			}
		})
	};

	onPanelIconClick (e, item) {
		const { id } = item;
		const { param } = this.props;
		const { classNameWrap } = param;
		const element = `.syncPanel ${UtilCommon.toCamelCase([ '#icon', id ].join('-'))}`;
		const menuParam = {
			classNameWrap,
			element,
			offsetY: 4,
			passThrough: true,
			data: item
		};

		e.preventDefault();
		e.stopPropagation();

		if (menuStore.isOpen('syncStatusInfo')) {
			if (id == this.currentInfo) {
				this.onCloseInfo();
			} else {
				this.currentInfo = id;
				menuStore.update('syncStatusInfo', menuParam);
			};
		} else {
			this.currentInfo = id;
			menuStore.open('syncStatusInfo', menuParam);
		};
	};

	onCloseInfo () {
		this.currentInfo = '';
		if (menuStore.isOpen('syncStatusInfo')) {
			menuStore.close('syncStatusInfo');
		};
	};

	load () {
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.getSystemLayouts() },
		];
		const sorts = [
			{ relationKey: 'syncDate', type: I.SortType.Desc },
		];

		UtilData.searchSubscribe({
			subId: 'syncStatusObjectsList',
			filters,
			sorts,
			keys: Constant.defaultRelationKeys.concat(Constant.syncStatusRelationKeys),
			offset: 0,
			limit: 30,
		}, (message: any) => {
			if (message.error.code) {
				this.setState({ isLoading: false });
				return;
			};

			this.items = this.items.concat(message.records || []);
			this.forceUpdate();
		});
	};

	getItems () {
		let items = this.items.slice();

		items = UtilData.groupDateSections(items, 'syncDate');

		return items;
	};

	getIcons () {
		const iconNetwork = this.getIconNetwork();
		const iconP2P = this.getIconP2P();

		return [ iconNetwork ];
	};

	getIconP2P () {
		C.DeviceList((message) => {
			console.log('MESSAGE: ', message)
		});
		return {};
	};

	getIconNetwork () {
		const syncData = authStore.syncData;
		const { network, error, syncingCounter } = syncData;

		let id = '';
		let title = '';
		let status = '';
		let message = '';
		let buttons: any[] = [];

		let isConnected = false;
		let isError = false;

		if ([ I.SyncStatusStatus.Syncing, I.SyncStatusStatus.Synced ].includes(syncData.status)) {
			isConnected = true;
			status = 'connected';
		} else
		if (I.SyncStatusStatus.Error == syncData.status) {
			isError = true;
			status = 'error';
		};

		switch (network) {
			case I.SyncStatusNetwork.Anytype: {
				id = 'network';
				title = translate('menuSyncStatusInfoNetworkTitle');

				if (isConnected) {
					if (syncingCounter) {
						message = UtilCommon.sprintf(translate('menuSyncStatusInfoNetworkMessageSyncing'), syncingCounter, UtilCommon.plural(syncingCounter, translate('pluralLCObject')));
					} else {
						message = translate('menuSyncStatusInfoNetworkMessageSynced');
					};
				} else
				if (isError) {
					message = translate(`menuSyncStatusInfoNetworkMessageError${error}`);

					if (error == I.SyncStatusError.IncompatibleVersion) {
						buttons.push({ id: 'updateApp', name: translate('menuSyncStatusInfoNetworkMessageErrorUpdateApp') });
					} else
					if (error == I.SyncStatusError.StorageLimitExceed) {
						buttons.push({ id: 'upgradeMembership', name: translate('menuSyncStatusInfoNetworkMessageErrorSeeMembership') });
					};
				} else {
					message = translate('menuSyncStatusInfoNetworkMessageOffline');
				};

				break;
			};
			case I.SyncStatusNetwork.SelfHost: {
				id = 'self';
				title = translate('menuSyncStatusInfoSelfTitle');

				switch (syncData.status) {
					case I.SyncStatusStatus.Syncing: {
						message = translate('menuSyncStatusInfoSelfMessageSyncing');
						break;
					};
					case I.SyncStatusStatus.Synced: {
						message = translate('menuSyncStatusInfoSelfMessageSynced');
						break;
					};
					case I.SyncStatusStatus.Error: {
						message = translate('menuSyncStatusInfoSelfMessageError');
						break;
					};
				};

				break;
			};
			case I.SyncStatusNetwork.LocalOnly: {
				id = 'localOnly';
				title = translate('menuSyncStatusInfoLocalOnlyTitle');
				message = translate('menuSyncStatusInfoLocalOnlyMessage');
				break;
			};
		};

		return { id, status, title, message, buttons };
	};

	getClassBySyncStatus (status: I.SyncStatusStatus) {
		console.log('STATUS: ', status)
		if (status == undefined || !I.SyncStatusStatus[status]) {
			return '';
		};
		return I.SyncStatusStatus[status].toLowerCase();
	};

	getRowHeight (item: any) {
		return item && item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
	};

});

export default MenuSyncStatus;
