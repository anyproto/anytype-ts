import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Title, Icon, IconObject, ObjectName } from 'Component';
import { I, S, U, Action, translate } from 'Lib';

const HEIGHT_SECTION = 26;
const HEIGHT_ITEM = 28;
const LIMIT_HEIGHT = 12;
const SUB_ID = 'syncStatusObjectsList';

const MenuSyncStatus = observer(class MenuSyncStatus extends React.Component<I.Menu, {}> {

	_isMounted = false;
	cache: any = {};
	items: any[] = [];
	currentInfo = '';

	constructor (props: I.Menu) {
		super(props);

		this.cache = new CellMeasurerCache({
			defaultHeight: HEIGHT_ITEM,
			fixedWidth: true,
		});

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
				<div
					id={U.Common.toCamelCase([ 'icon', id ].join('-'))}
					className={[ 'iconWrapper', status ? status : ''].join(' ')}
					onClick={e => this.onPanelIconClick(e, item)}
				>
					<Icon className={id} />
				</div>
			);
		};

		const Item = (item: any) => {
			const { syncStatus } = item;
			const icon = this.getClassBySyncStatus(syncStatus);

			return (
				<div
					id={`item-${item.id}`}
					className="item sides"
					onContextMenu={e => this.onContextMenu(e, item)}
				>
					<div className="side left">
						<IconObject object={item} size={20} />
						<div className="info">
							<ObjectName object={item} />
							{item.sizeInBytes ? <span className="size">{U.File.size(item.sizeInBytes)}</span> : ''}
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
				content = <div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={style}>{translate(U.Common.toCamelCase([ 'common', item.id ].join('-')))}</div>;
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
		this._isMounted = true;
		this.load();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.onCloseInfo();
	};

	onContextMenu (e, item) {
		const { id } = item;
		const { param } = this.props;
		const { classNameWrap } = param;
		const itemNode = $(`.syncMenuWrapper #item-${id}`);
		const options: any[] = [
			{ id: 'open', name: translate('commonOpen') }
		];

		if (U.Space.canMyParticipantWrite()) {
			options.push({ id: 'archive', name: translate('commonDeleteImmediately'), isRed: true });
		};

		itemNode.addClass('selected');
		S.Menu.open('select', {
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
							U.Object.openAuto(item);
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
		const element = `.syncPanel ${U.Common.toCamelCase([ '#icon', id ].join('-'))}`;
		const menuParam = {
			classNameWrap,
			element,
			offsetY: 4,
			passThrough: true,
			data: item
		};

		e.preventDefault();
		e.stopPropagation();

		if (S.Menu.isOpen('syncStatusInfo')) {
			if (id == this.currentInfo) {
				this.onCloseInfo();
			} else {
				this.currentInfo = id;
				S.Menu.update('syncStatusInfo', menuParam);
			};
		} else {
			this.currentInfo = id;
			S.Menu.open('syncStatusInfo', menuParam);
		};
	};

	onCloseInfo () {
		this.currentInfo = '';
		if (S.Menu.isOpen('syncStatusInfo')) {
			S.Menu.close('syncStatusInfo');
		};
	};

	load () {
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
		];
		const sorts = [
			{ relationKey: 'syncDate', type: I.SortType.Desc },
		];

		U.Data.searchSubscribe({
			subId: SUB_ID,
			filters,
			sorts,
			keys: U.Data.syncStatusRelationKeys(),
			offset: 0,
			limit: 30,
		});
	};

	getItems () {
		return U.Data.groupDateSections(S.Record.getRecords(SUB_ID), 'syncDate');
	};

	getIcons () {
		const iconNetwork = this.getIconNetwork();
		const iconP2P = this.getIconP2P();

		return [ iconNetwork ];
	};

	getIconP2P () {
		return {};
	};

	getIconNetwork () {
		const syncData = S.Auth.syncStatus;
		const { network, error, syncingCounter } = syncData;

		let id = '';
		let title = '';
		let status = '';
		let message = '';
		let buttons: any[] = [];

		let isConnected = false;
		let isError = false;

		if ([ I.SyncStatusSpace.Syncing, I.SyncStatusSpace.Synced ].includes(syncData.status)) {
			isConnected = true;
			status = 'connected';
		} else
		if (I.SyncStatusSpace.Error == syncData.status) {
			isError = true;
			status = 'error';
		};

		switch (network) {
			case I.SyncStatusNetwork.Anytype: {
				id = 'network';
				title = translate('menuSyncStatusInfoNetworkTitle');

				if (isConnected) {
					if (syncingCounter) {
						message = U.Common.sprintf(translate('menuSyncStatusInfoNetworkMessageSyncing'), syncingCounter, U.Common.plural(syncingCounter, translate('pluralLCObject')));
					} else {
						message = translate('menuSyncStatusInfoNetworkMessageSynced');
					};
				} else
				if (isError) {
					if (error) {
						message = translate(`menuSyncStatusInfoNetworkMessageError${error}`);
					};

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
					case I.SyncStatusSpace.Syncing: {
						message = translate('menuSyncStatusInfoSelfMessageSyncing');
						break;
					};
					case I.SyncStatusSpace.Synced: {
						message = translate('menuSyncStatusInfoSelfMessageSynced');
						break;
					};
					case I.SyncStatusSpace.Error: {
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

	getClassBySyncStatus (status: I.SyncStatusObject) {
		if (!status) {
			status = 0;
		};
		return I.SyncStatusObject[status].toLowerCase();
	};

	getRowHeight (item: any) {
		return item && item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
	};

});

export default MenuSyncStatus;
