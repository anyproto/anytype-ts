import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle, useCallback, MouseEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Footer, Header, ListObject, Icon, Title, Filter } from 'Component';
import { I, S, U, J, translate, Action, analytics, keyboard, sidebar, Preview } from 'Lib';

const PageMainArchive = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const filterRef = useRef(null);
	const filterWrapperRef = useRef(null);
	const [ selectedIds, setSelectedIds ] = useState<string[]>([]);
	const [ filterText, setFilterText ] = useState('');
	const filterTimeout = useRef(0);
	const subId = J.Constant.subId.archive;

	const spaceview = U.Space.getSpaceview();
	const isShared = spaceview.isShared;
	const isOwner = U.Space.isMyOwner();
	const participantId = U.Space.getCurrentParticipantId();
	const canWrite = U.Space.canMyParticipantWrite();

	const filters: I.Filter[] = [
		{ relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true },
	];

	const columns: any[] = [
		{
			relationKey: 'lastModifiedDate',
			name: translate('commonDeleted'),
			mapper: (v: number) => v ? U.Date.dateWithFormat(S.Common.dateFormat, v) : '',
		},
	];

	if (isShared) {
		columns.push({
			relationKey: 'creator',
			name: translate('commonCreatedBy'),
			isObject: true,
		});
	};

	const relationKeys = [ 'lastModifiedDate', 'creator' ];

	const getRecordIds = (): string[] => {
		return S.Record.getRecordIds(subId, '');
	};

	const canDeleteSelection = (): boolean => {
		if (isOwner || !isShared) {
			return true;
		};

		return selectedIds.every(id => {
			const obj = S.Detail.get(subId, id, [ 'creator' ]);
			return obj.creator === participantId;
		});
	};

	const onSelect = (id: string, e: MouseEvent) => {
		e.stopPropagation();

		const recordIds = getRecordIds();
		let ids = [ ...selectedIds ];

		if (e.shiftKey) {
			const idx = recordIds.findIndex(it => it == id);

			if ((idx >= 0) && (ids.length > 0)) {
				const lastIdx = recordIds.findIndex(it => it == ids[ids.length - 1]);

				if (lastIdx >= 0) {
					const [ start, end ] = lastIdx < idx ? [ lastIdx, idx + 1 ] : [ idx, lastIdx + 1 ];
					ids = [ ...new Set(ids.concat(recordIds.slice(start, end))) ];
				};
			};
		} else {
			ids = ids.includes(id) ? ids.filter(it => it != id) : ids.concat(id);
		};

		setSelectedIds(ids);
	};

	const onSelectAll = () => {
		if (selectedIds.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(getRecordIds());
		};
	};

	const onRestore = () => {
		if (!selectedIds.length) {
			return;
		};

		Action.restore(selectedIds, analytics.route.archive);
		setSelectedIds([]);
	};

	const onRemove = () => {
		if (!selectedIds.length || !canDeleteSelection()) {
			return;
		};

		Action.delete(selectedIds, analytics.route.archive, () => setSelectedIds([]));
	};

	const onEmptyBin = () => {
		Action.emptyBin(analytics.route.archive);
		setSelectedIds([]);
	};

	const onMore = (e: MouseEvent) => {
		e.stopPropagation();

		const options: any[] = [];

		if (isOwner) {
			options.push({ id: 'emptyBin', name: translate('commonEmptyBin'), iconParam: { name: 'menu/action/remove' } });
		};

		if (!options.length) {
			return;
		};

		S.Menu.open('select', {
			element: `#page-archive-more`,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			data: {
				options,
				onSelect: (_e: any, item: any) => {
					switch (item.id) {
						case 'emptyBin': onEmptyBin(); break;
					};
				},
			},
		});
	};

	const onFilterShow = () => {
		if (!filterRef.current) {
			return;
		};

		$(filterWrapperRef.current).addClass('active');
		filterRef.current?.focus();

		const container = U.Common.getPageFlexContainer(isPopup);
		const win = $(window);

		container.off('mousedown.filter').on('mousedown.filter', (e: any) => {
			const value = filterRef.current?.getValue();

			if (!value && !$(e.target).parents('.filterWrapper').length) {
				onFilterHide();
				container.off('mousedown.filter');
			};
		});

		win.off('keydown.filter').on('keydown.filter', (e: any) => {
			keyboard.shortcut('escape', e, () => {
				onFilterHide();
				win.off('keydown.filter');
			});
		});
	};

	const onFilterHide = () => {
		if (!filterRef.current) {
			return;
		};

		$(filterWrapperRef.current).removeClass('active');
		filterRef.current.setValue('');
		filterRef.current.blur();
		setFilterText('');
	};

	const onFilterChange = () => {
		window.clearTimeout(filterTimeout.current);
		filterTimeout.current = window.setTimeout(() => {
			setFilterText(String(filterRef.current?.getValue() || ''));
		}, J.Constant.delay.keyboard);
	};

	const getFilters = (): I.Filter[] => {
		const fl = [ ...filters ];

		if (filterText) {
			fl.push({ relationKey: 'name', condition: I.FilterCondition.Like, value: filterText });
		};

		return fl;
	};

	const onDeleteMouseEnter = (e: MouseEvent) => {
		if (!canDeleteSelection()) {
			Preview.tooltipShow({ text: translate('binDeleteDisabledTooltip'), element: $(e.currentTarget) });
		};
	};

	const onDeleteMouseLeave = () => {
		Preview.tooltipHide(false);
	};

	const resize = () => {
		const win = $(window);
		const container = U.Common.getPageFlexContainer(isPopup);
		const node = $(nodeRef.current);
		const wh = isPopup ? container.height() : win.height();

		node.css({ height: wh - J.Size.header });
	};

	const onKeyDown = useCallback((e: KeyboardEvent) => {
		keyboard.shortcut('searchText', e, () => {
			e.preventDefault();
			onFilterShow();
		});
	}, []);

	useEffect(() => {
		analytics.event('ScreenBin');
		sidebar.rightPanelClose(isPopup, false);

		return () => {
			window.clearTimeout(filterTimeout.current);
			U.Common.getPageFlexContainer(isPopup).off('mousedown.filter');
			$(window).off('keydown.filter');
		};
	}, []);

	useEffect(() => {
		const win = $(window);

		win.on('keydown.archive', (e: any) => onKeyDown(e));
		return () => { win.off('keydown.archive'); };
	}, []);

	useImperativeHandle(ref, () => ({
		resize,
	}));

	const isAllSelected = (selectedIds.length > 0) && (selectedIds.length >= getRecordIds().length);
	const canDelete = canDeleteSelection();
	const cnDelete = [ 'button', ((!canDelete || !selectedIds.length) ? 'isDisabled' : '') ];
	const cnRestore = [ 'button', (!selectedIds.length ? 'isDisabled' : '') ];

	return (
		<>
			<Header
				{...props}
				component={U.Common.settingsHeader(isPopup, 'mainEmpty')}
			/>

			<div ref={nodeRef} className="wrapper">
				<div className="titleWrapper">
					<Icon name="common/bin" size={32} color="default" />
					<Title text={translate('commonBin')} />
				</div>

				{canWrite ? (
					<div className="controls">
						<div className="side left">
							<div className={cnRestore.join(' ')} onClick={onRestore}>
								<Icon name="menu/action/restore" />
								<div className="name">{translate('commonRestore')}</div>
							</div>
							<div
								className={cnDelete.join(' ')}
								onClick={onRemove}
								onMouseEnter={onDeleteMouseEnter}
								onMouseLeave={onDeleteMouseLeave}
							>
								<Icon name="menu/action/remove" />
								<div className="name">{translate('commonDeleteImmediately')}</div>
							</div>
						</div>
						<div className="side right">
							<Icon name="common/search" className="searchIcon" onClick={onFilterShow} />

							<div ref={filterWrapperRef} className="filterWrapper">
								<Filter
									ref={filterRef}
									className="underlined"
									onChange={onFilterChange}
									placeholder={translate('commonSearchPlaceholder')}
								/>
							</div>

							{isOwner ? (
								<Icon id="page-archive-more" name="common/more" className="moreIcon" onClick={onMore} />
							) : ''}
						</div>
					</div>
				) : ''}

				<ListObject
					ref={listRef}
					subId={subId}
					rootId=""
					spaceId=""
					route={analytics.route.archive}
					columns={columns}
					filters={getFilters()}
					relationKeys={relationKeys}
					ignoreArchived={false}
					defaultSortId="lastModifiedDate"
					defaultSortType={I.SortType.Desc}
					selectable={canWrite}
					selectedIds={selectedIds}
					isAllSelected={isAllSelected}
					onSelect={onSelect}
					onSelectAll={onSelectAll}
				/>
			</div>

			<Footer {...props} component="mainObject" />
		</>
	);

}));

export default PageMainArchive;
