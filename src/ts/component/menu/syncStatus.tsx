import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Title, Icon, IconObject, ObjectName, EmptySearch, UpsellBanner, Label } from 'Component';
import { I, S, U, J, Action, translate, analytics, Onboarding } from 'Lib';

const HEIGHT = 28;
const LIMIT = 12;
const SUB_ID = 'syncStatusObjectsList';

const MenuSyncStatus = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, setActive, getId, onKeyDown, position, close } = props;
	const { classNameWrap } = param;
	const [ isLoading, setIsLoading ] = useState(false);
	const [ itemId, setItemId ] = useState('');
	const listRef = useRef(null);
	const n = useRef(0);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }));
	const emptyText = U.Data.isLocalNetwork() ? translate('menuSyncStatusEmptyLocal') : translate('menuSyncStatusEmpty');

	useEffect(() => {
		load();
		rebind();
		resize();

		return () => {
			unbind();
			U.Subscription.destroyList([ SUB_ID ]);
		};
	}, []);

	useEffect(() => {
		resize();	
	});

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		$(`#${getId()}`).on('click', () => onCloseInfo());
	};

	const unbind = () => {
		$(window).off('keydown.menu');
		$(`#${getId()}`).off('click');
	};

	const onContextMenu = (e, item) => {
		e.stopPropagation();

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
				},
			},
		});
	};

	const onPanelIconClick = (e, item) => {
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
			if (item.id == itemId) {
				onCloseInfo();
			} else {
				setItemId(item.id);
				S.Menu.update('syncStatusInfo', menuParam);
			};
		} else {
			setItemId(item.id);
			S.Menu.open('syncStatusInfo', menuParam);
		};
	};

	const onCloseInfo = () => {
		setItemId('');

		if (S.Menu.isOpen('syncStatusInfo')) {
			S.Menu.close('syncStatusInfo');
		};
	};

	const load = () => {
		if (U.Data.isLocalNetwork()) {
			return;
		};

		const filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts().concat(I.ObjectLayout.Participant) },
		];
		const sorts = [
			{ relationKey: 'syncStatus', type: I.SortType.Custom, customOrder: [ I.SyncStatusObject.Error, I.SyncStatusObject.Syncing, I.SyncStatusObject.Queued, I.SyncStatusObject.Synced ] },
			{ relationKey: 'syncDate', type: I.SortType.Desc, includeTime: true },
		];

		setIsLoading(true);

		U.Subscription.subscribe({
			subId: SUB_ID,
			filters,
			sorts,
			keys: U.Subscription.syncStatusRelationKeys(),
			offset: 0,
			limit: 50,
		}, () => {
			setIsLoading(false);
			window.setTimeout(() => Onboarding.start('syncStatus', false), J.Constant.delay.menu);
		});
	};

	const getItems = () => {
		const records = S.Record.getRecords(SUB_ID).map(it => {
			if ([ I.SyncStatusObject.Syncing, I.SyncStatusObject.Queued ].includes(it.syncStatus)) {
				it.syncDate = U.Date.now();
			};
			return it;
		});

		return U.Data.groupDateSections(records, 'syncDate');
	};

	const getIcons = () => {
		const syncStatus = S.Auth.getSyncStatus(S.Common.space);
		const iconNetwork = getIconNetwork(syncStatus);
		const iconP2P = getIconP2P(syncStatus);

		return [ iconP2P, iconNetwork ];
	};

	const getIconP2P = (syncStatus) => {
		const { p2p, devicesCounter } = syncStatus;

		let className = '';
		let message = '';
		let label = '';

		if (devicesCounter) {
			message = U.String.sprintf(translate('menuSyncStatusP2PDevicesConnected'), devicesCounter, U.Common.plural(devicesCounter, translate('pluralDevice')));

			if (devicesCounter > 1) {
				label = devicesCounter;
			};
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
			label,
			className,
			title: translate('menuSyncStatusInfoP2pTitle'),
			message,
			buttons: []
		};
	};

	const getIconNetwork = (syncStatus) => {
		const { network, syncingCounter, error, status } = syncStatus;
		const buttons: any[] = [];

		let id = '';
		let label = '';
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

			case I.SyncStatusSpace.Offline: {
				className = 'offline';
			};
		};

		switch (network) {
			case I.SyncStatusNetwork.Anytype: {
				id = 'network';
				label = translate('menuSyncStatusLabelAnyNetwork');
				title = translate('menuSyncStatusInfoNetworkTitle');

				if (isConnected) {
					if (isSlow) {
						message = translate('menuSyncStatusInfoNetworkMessageSyncMightBeSlow');
						buttons.push({ id: 'updateApp', name: translate('menuSyncStatusInfoNetworkMessageErrorUpdateApp') });
					} else
					if (syncingCounter) {
						message = U.String.sprintf(translate('menuSyncStatusInfoNetworkMessageSyncing'), syncingCounter, U.Common.plural(syncingCounter, translate('pluralLCObject')));
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
				label = translate('menuSyncStatusLabelCustom');
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

		return { id, label, className, title, message, buttons };
	};

	const resize = () => {
		const items = getItems().slice(0, LIMIT);
		const obj = $(`#${getId()} .content`);
		const height = items.length ? items.length * HEIGHT + 64 : 160;

		obj.css({ height });
		position();
	};

	const scrollToRow = (items: any[], index: number) => {
		if (!listRef.current || !items.length) {
			return;
		};

		const listHeight = listRef.current.props.height;

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
		listRef.current.scrollToPosition(offset);
	};

	const items = getItems();
	const icons = getIcons();

	const PanelIcon = (item) => {
		const { id, className, label } = item;
		const cn = [ 'iconWrapper' ];
		const cni = [ 'inner' ];

		if (className) {
			cn.push(className);
		};

		if (label) {
			cni.push('withLabel');
		};

		return (
			<div
				id={`icon-${id}`}
				className={cn.join(' ')}
				onClick={e => onPanelIconClick(e, item)}
			>
				<div className="iconBg" />
				<div className={cni.join(' ')}>
					<Icon className={id} />
					{label ? <Label text={label} /> : ''}
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
				<div
					id={`item-${item.id}`}
					className="item sides"
					style={style}
					onClick={e => onContextMenu(e, item)}
					onMouseEnter={() => setActive(item, false)}
					onContextMenu={e => onContextMenu(e, item)}
				>
					<div className="side left" >
						<IconObject object={item} size={20} />
						<div className="info">
							<ObjectName object={item} />
							{item.sizeInBytes ? <span className="size">{U.File.size(item.sizeInBytes)}</span> : ''}
						</div>
					</div>
					<div className="side right">
						<Icon className={U.Data.syncStatusClass(item.syncStatus)} />
						<Icon className="more" onClick={e => onContextMenu(e, item)} />
					</div>
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

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getListRef: () => listRef.current,
		scrollToRow,
	}), []);

	return (
		<>
			<div className="syncPanel">
				<Title text={translate('menuSyncStatusTitle')} />

				<div className="icons">
					{icons.map((icon, idx) => <PanelIcon key={idx} {...icon} />)}
				</div>
			</div>

			<UpsellBanner components={[ 'storage' ]} className="fromSyncMenu" route={analytics.route.syncStatus} />

			{!isLoading && !items.length ? (
				<EmptySearch text={emptyText} />
			) : ''}

			{items.length ? (
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
										ref={listRef}
										width={width}
										height={height}
										deferredMeasurmentCache={cache.current}
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

}));

export default MenuSyncStatus;