import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Title, Icon, IconObject, ObjectName, EmptySearch, Label, Button, UpsellBanner } from 'Component';
import { I, S, U, J, Action, translate, analytics, Onboarding } from 'Lib';

interface State {
	isLoading: boolean;
};

const HEIGHT = 28;
const SUB_ID = 'syncStatusObjectsList';
const LIMIT = 12;

const MenuSyncStatus = observer(class MenuSyncStatus extends React.Component<I.Menu, State> {

	cache: any = {};
	currentInfo = '';
	refList: any = null;
	state = { 
		isLoading: false,
	};
	n = 0;

	constructor (props: I.Menu) {
		super(props);

		this.cache = new CellMeasurerCache({
			defaultHeight: HEIGHT,
			fixedWidth: true,
		});

		this.onContextMenu = this.onContextMenu.bind(this);
		this.onPanelIconClick = this.onPanelIconClick.bind(this);
		this.onCloseInfo = this.onCloseInfo.bind(this);
	};

	render () {
		const { isLoading } = this.state;
		const notSyncedCounter = S.Auth.getNotSynced().total;
		const { setActive } = this.props;
		const isOwner = U.Space.isMyOwner();
		const canWrite = U.Space.canMyParticipantWrite();
		const items = this.getItems();
		const icons = this.getIcons();
		const emptyText = U.Data.isLocalNetwork() ? translate('menuSyncStatusEmptyLocal') : translate('menuSyncStatusEmpty');
		const showIncentive = notSyncedCounter && canWrite && U.Data.isAnytypeNetwork();

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
					onMouseEnter={() => setActive(item, false)}
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
			<>
				<div className="syncPanel">
					<Title text={translate('menuSyncStatusTitle')} />

					<div className="icons">
						{icons.map((icon, idx) => <PanelIcon key={idx} {...icon} />)}
					</div>
				</div>

				<UpsellBanner components={[ 'storage' ]} className="fromSyncMenu" route={analytics.route.syncStatus} />

				{showIncentive ? (
					<div className="incentiveBanner">
						<Title text={translate('menuSyncStatusIncentiveBannerTitle')} />
						<Label text={U.Common.sprintf(translate('menuSyncStatusIncentiveBannerLabel'), notSyncedCounter, U.Common.plural(notSyncedCounter, translate('pluralLCFile')))} />
						<div className="buttons">
							<Button text={translate('menuSyncStatusIncentiveBannerReviewFiles')} color="dark" className="c28" onClick={() => this.onIncentiveButtonClick('storage')} />
							{isOwner ? <Button className="c28" text={translate('commonUpgrade')} onClick={() => this.onIncentiveButtonClick('upgrade')} /> : ''}
						</div>
					</div>
				) : ''}

				{!isLoading && !items.length ? (
					<EmptySearch text={emptyText} />
				) : ''}

				{this.cache && items.length ? (
					<div className="items">
						<InfiniteLoader
							rowCount={items.length}
							isRowLoaded={({ index }) => !!items[index]}
							threshold={20}
							loadMoreRows={() => {}}
						>
							{({ onRowsRendered }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={ref => this.refList = ref}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={HEIGHT}
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
			</>
		);
	};

	componentDidMount () {
		this.load();
		this.rebind();
		this.resize();
	};

	componentDidUpdate (): void {
		this.resize();	
	};

	componentWillUnmount () {
		this.unbind();

		U.Subscription.destroyList([ SUB_ID ]);
	};

	rebind () {
		const { getId } = this.props;

		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		$(`#${getId()}`).on('click', () => this.onCloseInfo());
	};

	unbind () {
		const { getId } = this.props;

		$(window).off('keydown.menu');
		$(`#${getId()}`).off('click');
	};

	onContextMenu (e, item) {
		e.stopPropagation();

		const { getId, param } = this.props;
		const { classNameWrap } = param;
		const canWrite = U.Space.canMyParticipantWrite();
		const canDelete = S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Delete ]);
		const element = $(e.currentTarget);
		const itemElement = $(`#${getId()} #item-${item.id}`);
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

	onIncentiveButtonClick (id: string) {
		switch (id) {
			case 'storage': {
				const { files } = S.Auth.getNotSynced();

				if (files.length && (files[0].spaceId != U.Space.getSpaceview().spaceId)) {
					U.Router.switchSpace(files[0].spaceId, '/main/settings/spaceStorage', false, {}, false);
				} else {
					U.Object.openAuto({ id: 'spaceStorage', layout: I.ObjectLayout.Settings });
				};
				break;
			};

			case 'upgrade': {
				const usage = Math.round(U.Common.calculateStorageUsage());

				Action.membershipUpgrade();

				analytics.event('ClickUpgradePlanTooltip', { type: `StorageExceeded`, usage, route: analytics.route.syncStatus });
				break;
			};
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
			{ relationKey: 'syncStatus', type: I.SortType.Custom, customOrder: [ I.SyncStatusObject.Error, I.SyncStatusObject.Syncing, I.SyncStatusObject.Queued, I.SyncStatusObject.Synced ] },
			{ relationKey: 'syncDate', type: I.SortType.Desc, includeTime: true },
		];

		this.setState({ isLoading: true });

		U.Subscription.subscribe({
			subId: SUB_ID,
			filters,
			sorts,
			keys: U.Subscription.syncStatusRelationKeys(),
			offset: 0,
			limit: 50,
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
		const syncStatus = S.Auth.getSyncStatus(S.Common.space);
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
		const { network, syncingCounter, error, status } = syncStatus;
		const buttons: any[] = [];

		let id = '';
		let title = '';
		let className = '';
		let message = '';
		let isConnected = false;
		let isError = false;
		let isSlow = false;

		switch (status) {
			case I.SyncStatusSpace.Syncing:
			case I.SyncStatusSpace.Synced: {
				isConnected = true;
				className = 'connected';
				break;
			};

			case I.SyncStatusSpace.Upgrade: {
				isConnected = true;
				isSlow = true;
				className = 'connectedSlow';
				break;
			};

			case I.SyncStatusSpace.Error: {
				isError = true;
				className = 'error';
				break;
			};
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
						message = translate('commonSynced');
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

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems().slice(0, LIMIT);
		const obj = $(`#${getId()} .content`);

		let height = 44;
		if (!items.length) {
			height = 160;
		} else {
			height = items.reduce((res: number, current: any) => res + HEIGHT, height);
		};

		obj.css({ height });
		position();
	};

	scrollToRow (items: any[], index: number) {
		if (!this.refList || !items.length) {
			return;
		};

		const listHeight = this.refList.props.height;

		let offset = 0;
		let total = 0;

		for (let i = 0; i < items.length; ++i) {
			if (i < index) {
				offset += HEIGHT;
			};
			total += HEIGHT;
		};

		if (offset + HEIGHT < listHeight) {
			offset = 0;
		} else {
			offset -= listHeight / 2 - HEIGHT / 2;
		};

		offset = Math.min(offset, total - listHeight + 16);
		this.refList.scrollToPosition(offset);
	};

});

export default MenuSyncStatus;
