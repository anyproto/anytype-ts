import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Title, Icon, IconObject, ObjectName, EmptySearch } from 'Component';
import { I, C, S, U, J, Action, translate, analytics, Onboarding } from 'Lib';

interface State {
	isLoading: boolean;
};

const HEIGHT_SECTION = 26;
const HEIGHT_ITEM = 28;
const LIMIT_HEIGHT = 12;
const SUB_ID = 'syncStatusObjectsList';

const MenuSyncStatus = observer(class MenuSyncStatus extends React.Component<I.Menu, State> {

	_isMounted = false;
	node = null;
	cache: any = {};
	items: any[] = [];
	currentInfo = '';
	state = { 
		isLoading: false,
	};

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
		const { isLoading } = this.state;
		const items = this.getItems();
		const icons = this.getIcons();
		const emptyText = U.Data.isLocalNetwork() ? translate('menuSyncStatusEmptyLocal') : translate('menuSyncStatusEmpty');

		const PanelIcon = (item) => {
			const { id, className } = item;
			const cn = [ 'iconWrapper' ];

			if (className) {
				cn.push(className);
			};

			return (
				<div
					id={`icon-${id}`}
					className={cn.join(' ')}
					onClick={e => this.onPanelIconClick(e, item)}
				>
					<div className="iconBg" />
					<Icon className={id} />
				</div>
			);
		};

		const Item = (item: any) => {
			const icon = U.Data.syncStatusClass(item.syncStatus);

			return (
				<div
					id={`item-${item.id}`}
					className="item sides"
					onClick={e => this.onContextMenu(e, item)}
					onContextMenu={e => this.onContextMenu(e, item)}
				>
					<div className="side left" >
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
				content = (
					<div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={style}>
						{item.name}
					</div>
				);
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
			<div ref={ref => this.node = ref} className="syncMenuWrapper" onClick={this.onCloseInfo}>
				<div className="syncPanel">
					<Title text={translate('menuSyncStatusTitle')} />

					<div className="icons">
						{icons.map((icon, idx) => <PanelIcon key={idx} {...icon} />)}
					</div>
				</div>

				{!isLoading && !items.length ? (
					<EmptySearch text={emptyText} />
				) : ''}

				{this.cache && items.length ? (
					<div className="items">
						<InfiniteLoader
							rowCount={items.length}
							isRowLoaded={({ index }) => !!items[index]}
							threshold={LIMIT_HEIGHT}
							loadMoreRows={() => {}}
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

		C.ObjectSearchUnsubscribe([ SUB_ID ]);
	};

	onContextMenu (e, item) {
		e.stopPropagation();

		const { param } = this.props;
		const { classNameWrap } = param;
		const canWrite = U.Space.canMyParticipantWrite();
		const canDelete = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ]);
		const element = $(e.currentTarget);
		const node = $(this.node);
		const itemElement = node.find(`#item-${item.id}`);
		const options: any[] = [
			{ id: 'open', name: translate('commonOpen') }
		];

		if (canWrite && canDelete) {
			options.push({ id: 'delete', color: 'red', name: translate('commonDeleteImmediately') });
		};

		S.Menu.open('select', {
			classNameWrap,
			element,
			horizontal: I.MenuDirection.Center,
			offsetY: 4,
			onOpen: () => itemElement.addClass('hover'),
			onClose: () => itemElement.removeClass('hover'),
			data: {
				options,
				onSelect: (e, option) => {
					switch (option.id) {
						case 'open': {
							U.Object.openAuto(item);
							break;
						};
						case 'delete': {
							Action.delete([ item.id ], analytics.route.syncStatus);
							break;
						};
					};
				}
			}
		});
	};

	onPanelIconClick (e, item) {
		const { param, getId } = this.props;
		const { classNameWrap } = param;
		const menuParam = {
			classNameWrap,
			element: `#${getId()} #icon-${item.id}`,
			offsetY: 4,
			passThrough: true,
			horizontal: I.MenuDirection.Center,
			data: item,
		};

		e.preventDefault();
		e.stopPropagation();

		if (S.Menu.isOpen('syncStatusInfo')) {
			if (item.id == this.currentInfo) {
				this.onCloseInfo();
			} else {
				this.currentInfo = item.id;
				S.Menu.update('syncStatusInfo', menuParam);
			};
		} else {
			this.currentInfo = item.id;
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
		if (U.Data.isLocalNetwork()) {
			return;
		};

		const filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
		];
		const sorts = [
			{ relationKey: 'syncStatus', type: I.SortType.Custom, customOrder: [ I.SyncStatusObject.Syncing, I.SyncStatusObject.Queued, I.SyncStatusObject.Synced ] },
			{ relationKey: 'syncDate', type: I.SortType.Desc, includeTime: true },
		];

		this.setState({ isLoading: true });

		U.Data.searchSubscribe({
			subId: SUB_ID,
			filters,
			sorts,
			keys: U.Data.syncStatusRelationKeys(),
			offset: 0,
			limit: 30,
		}, () => {
			this.setState({ isLoading: false });

			window.setTimeout(() => Onboarding.start('syncStatus', false), J.Constant.delay.menu);
		});
	};

	getItems () {
		const records = S.Record.getRecords(SUB_ID).map(it => {
			if ([ I.SyncStatusObject.Syncing, I.SyncStatusObject.Queued ].includes(it.syncStatus)) {
				it.syncDate = U.Date.now();
			};
			return it;
		});

		return U.Data.groupDateSections(records, 'syncDate');
	};

	getIcons () {
		const syncStatus = S.Auth.getSyncStatus();
		const iconNetwork = this.getIconNetwork(syncStatus);
		const iconP2P = this.getIconP2P(syncStatus);

		return [ iconP2P, iconNetwork ];
	};

	getIconP2P (syncStatus) {
		const { p2p, devicesCounter } = syncStatus;

		let className = '';
		let message = '';

		if (devicesCounter) {
			message = U.Common.sprintf(translate('menuSyncStatusP2PDevicesConnected'), devicesCounter, U.Common.plural(devicesCounter, translate('pluralDevice')));
		} else {
			message = translate('menuSyncStatusP2PNoDevicesConnected');
		};

		switch (p2p) {
			case I.P2PStatus.Connected: {
				className = 'connected';
				break;
			};
			case I.P2PStatus.NotPossible: {
				message = translate('menuSyncStatusP2PRestricted');
				className = 'error';
				break;
			};
		};

		return {
			id: 'p2p',
			className,
			title: translate('menuSyncStatusInfoP2pTitle'),
			message,
			buttons: []
		};
	};

	getIconNetwork (syncStatus) {
		const { network, error, syncingCounter, status } = syncStatus;
		const buttons: any[] = [];

		let id = '';
		let title = '';
		let className = '';
		let message = '';
		let isConnected = false;
		let isError = false;
		let isSlow = false;

		if ([ I.SyncStatusSpace.Syncing, I.SyncStatusSpace.Synced ].includes(status)) {
			isConnected = true;
			className = 'connected';
		} else
		if (I.SyncStatusSpace.Upgrade == status) {
			isConnected = true;
			isSlow = true;
			className = 'connectedSlow';
		} else
		if (I.SyncStatusSpace.Error == status) {
			isError = true;
			className = 'error';
		};

		switch (network) {
			case I.SyncStatusNetwork.Anytype: {
				id = 'network';
				title = translate('menuSyncStatusInfoNetworkTitle');

				if (isConnected) {
					if (isSlow) {
						message = translate('menuSyncStatusInfoNetworkMessageSyncMightBeSlow');
						buttons.push({ id: 'updateApp', name: translate('menuSyncStatusInfoNetworkMessageErrorUpdateApp') });
					} else
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
						buttons.push({ id: 'upgradeMembership', name: translate('menuSyncStatusInfoNetworkMessageErrorAddMoreStorage') });
					};
				} else {
					message = translate('menuSyncStatusInfoNetworkMessageOffline');
				};

				break;
			};
			case I.SyncStatusNetwork.SelfHost: {
				id = 'self';
				title = translate('menuSyncStatusInfoSelfTitle');

				switch (status) {
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
				className = '';
				break;
			};
		};

		return { id, className, title, message, buttons };
	};

	getRowHeight (item: any) {
		return item && item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
	};

});

export default MenuSyncStatus;
