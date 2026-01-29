import React, { forwardRef, useRef, useImperativeHandle, useEffect, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, Button, IconObject, ObjectName, Label, Icon, Title, Loader, EmptySearch } from 'Component';
import { I, C, J, S, U, keyboard, translate, analytics } from 'Lib';

const HEIGHT = 56;
const LIMIT = 10;

const MenuChangeOwner = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { setActive, onKeyDown, position, getId, close } = props;
	const { space } = S.Common;
	const [ filter, setFilter ] = useState('');
	const [ selected, setSelected ] = useState('');
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT }));
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const n = useRef(-1);
	const top = useRef(0);

	useEffect(() => {
		rebind();
		beforePosition();
	}, []);

	useEffect(() => {
		beforePosition();

		if (n.current == -1) {
			focus();
		};
	});

	useEffect(() => {
		n.current = -1;
		top.current = 0;
		listRef.current?.scrollToPosition(top.current);
	}, [ filter ]);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const focus = () => {
		window.setTimeout(() => filterRef.current?.focus(), 15);
	};

	const getItems = (): any[] => {
		let items = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]).filter(it => !it.isOwner);
		
		if (filter) {
			const reg = new RegExp(U.String.regexEscape(filter), 'gi');

			items = items.filter(it => {
				const name = String(it.name || '');
				const globalName = String(it.globalName || '');
				const identity = String(it.identity || '');

				return name.match(reg) || globalName.match(reg) || identity.match(reg);
			});
		};

		return items;
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClick = (e: any, item: any) => {
		e.stopPropagation();
		setSelected(item.identity);
	};

	const onFilterChange = (v: string) => {
		setFilter(v);
	};

	const onScroll = ({ scrollTop }) => {
		if (scrollTop) {
			top.current = scrollTop;
		};
	};

	const onNext = () => {
		if (!selected) {
			return;
		};

		const items = getItems();
		const item = items.find(it => it.identity == selected);

		if (!item) {
			return;
		};

		const spaceview = U.Space.getSpaceview();
		const spaceName = spaceview?.name || '';

		close(() => {
			S.Popup.open('confirm', {
				className: 'changeOwner',
				onOpen: () => {
					analytics.event('ScreenTransferSpaceOwnershipWarning');
				},
				data: {
					icon: 'key-red',
					title: translate('popupConfirmOwnershipTransferTitle'),
					text: U.String.sprintf(
						translate('popupConfirmOwnershipTransferText'),
						spaceName,
						item.name,
						item.name
					),
					textConfirm: translate('commonConfirm'),
					colorConfirm: 'red',
					confirmMessage: spaceName,
					buttonSize: 40,
					onConfirm: () => {
						analytics.event('ClickTransferSpaceOwnershipWarning');

						window.setTimeout(() => {
							S.Popup.open('confirm', {
								className: 'changeOwnerLoading',
								preventCloseByClick: true,
								data: {
									icon: <Loader type={I.LoaderType.Loader} />,
									title: translate('popupConfirmOwnershipTransferringTitle'),
									text: translate('popupConfirmOwnershipTransferringText'),
									canConfirm: false,
									canCancel: false,
								},
							});

							C.SpaceChangeOwnership(space, item.identity, (message: any) => {
								S.Popup.close('confirm');

								if (message.error.code) {
									return;
								};

								window.setTimeout(() => {
									S.Popup.open('confirm', {
										className: 'changeOwnerSuccess',
										onOpen: () => {
											analytics.event('ScreenTransferSpaceOwnershipSuccess');
										},
										data: {
											icon: 'key-green',
											title: translate('popupConfirmOwnershipTransferredTitle'),
											text: U.String.sprintf(
												translate('popupConfirmOwnershipTransferredText'),
												spaceName,
												item.name
											),
											textConfirm: translate('popupConfirmOwnershipTransferredButton'),
											colorConfirm: 'blank',
											canCancel: false,
											buttonSize: 40,
										},
									});
								}, J.Constant.delay.popup);
							});

						}, J.Constant.delay.popup);
					},
				},
			});
		});
	};

	const beforePosition = () => {
		const items = getItems();
		const obj = $(`#${getId()}`);
		const content = obj.find('.content');
		const length = items.length;
		const { wh } = U.Common.getWindowDimensions();

		let height = 44 + 44 + 56; // title + filter + button
		if (!length) {
			height += HEIGHT;
		} else {
			height += Math.min(5, length) * HEIGHT;
		};
		height = Math.min(height, wh - 104);

		content.css({ height });
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
	const length = items.length;

	const rowRenderer = (param: any) => {
		const item = items[param.index];
		if (!item) {
			return null;
		};

		const isSelected = item.identity == selected;
		const cn = [ 'item' ];

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<div
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onMouseEnter={e => onMouseEnter(e, item)}
					onClick={e => onClick(e, item)}
					style={param.style}
				>
					<IconObject object={item} size={40} />
					<div className="info">
						<ObjectName object={item} withBadge={true} />
						{item.globalName ? <Label className="globalName" text={item.globalName} /> : ''}
					</div>
					{isSelected ? <Icon className="chk" /> : ''}
				</div>
			</CellMeasurer>
		);
	};

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		getItems,
		getListRef: () => listRef.current,
		getFilterRef: () => filterRef.current,
		scrollToRow,
		beforePosition,
	}));

	return (
		<div className="wrap">
			<div className="titleWrap">
				<div className="side left" />
				<Title text={translate('popupSettingsSpaceShareSelectNewOwner')} />
				<div className="side right">
					<Icon className="close withBackground" onClick={e => close()} />
				</div>
			</div>

			<Filter
				ref={filterRef}
				icon="search"
				className="outlined round c32"
				placeholder={translate('commonSearch')}
				onChange={onFilterChange}
				focusOnMount={true}
			/>

			{!length ? (
				<EmptySearch text={translate('commonNothingFound')} />
			) : (
				<div className="items">
					{!length ? (
						<div className="item empty">
							<Label text={translate('commonNothingFound')} />
						</div>
					) : (
						<InfiniteLoader
							rowCount={length}
							loadMoreRows={() => {}}
							isRowLoaded={({ index }) => !!items[index]}
						>
							{({ onRowsRendered }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={listRef}
											width={width}
											height={height}
											deferredMeasurmentCache={cache.current}
											rowCount={length}
											rowHeight={HEIGHT}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											onScroll={onScroll}
											scrollToAlignment="center"
											overscanRowCount={LIMIT}
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					)}
				</div>
			)}

			<div className="buttons">
				<Button
					text={translate('commonNext')}
					className={[ 'c36', (!selected ? 'disabled' : '') ].join(' ')}
					color="accent"
					onClick={onNext}
				/>
			</div>
		</div>
	);

}));

export default MenuChangeOwner;