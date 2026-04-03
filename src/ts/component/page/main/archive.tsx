import React, { forwardRef, useRef, useState, useEffect, useCallback, MouseEvent } from 'react';
import { Footer, Header, ListObject, Icon, Title, Filter } from 'Component';
import ArchiveListTree from './archiveListTree';
import * as I from 'Interface';
import Storage from 'Lib/storage';

type ViewMode = 'tree' | 'compact' | 'detailed';

const PageMainArchive = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const { dateFormat } = S.Common;
	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const filterRef = useRef(null);
	const [ selectedIds, setSelectedIds ] = useState<string[]>([]);
	const [ filterText, setFilterText ] = useState('');
	const [ viewMode, setViewMode ] = useState<ViewMode>(() => {
		return (Storage.get('binViewMode') as ViewMode) || 'tree';
	});
	const [ sortId, setSortId ] = useState('lastModifiedDate');
	const [ sortType, setSortType ] = useState(I.SortType.Desc);
	const filterTimeout = useRef(0);
	const subId = J.Constant.subId.archive;
	const spaceview = U.Space.getSpaceview();
	const isShared = spaceview.isShared;
	const isOwner = U.Space.isMyOwner();
	const participantId = U.Space.getCurrentParticipantId();
	const canWrite = U.Space.canMyParticipantWrite();
	const hasSelection = selectedIds.length > 0;

	const filters: I.Filter[] = [
		{ relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: true },
	];

	const columns: any[] = [
		{
			relationKey: 'lastModifiedDate',
			name: translate('commonDeleted'),
			width: '20%',
			mapper: (v: number) => v ? U.Date.dateWithFormat(dateFormat, v) : '',
		},
	];

	if (isShared) {
		columns.push({
			relationKey: 'creator',
			name: translate('commonCreatedBy'),
			width: '20%',
			isObject: true,
		});
	};

	const relationKeys = [ 'lastModifiedDate', 'creator', 'createdInContext' ];

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
		if (hasSelection) {
			setSelectedIds([]);
		} else {
			setSelectedIds(getRecordIds());
		};
	};

	const onRestore = () => {
		if (!hasSelection) {
			return;
		};

		Action.restore(selectedIds, analytics.route.archive);
		setSelectedIds([]);
	};

	const onRemove = () => {
		if (!hasSelection || !canDeleteSelection()) {
			return;
		};

		Action.delete(selectedIds, analytics.route.archive, () => setSelectedIds([]));
	};

	const onSortChange = (id: string, type: I.SortType) => {
		setSortId(id);
		setSortType(type);
	};

	const nextViewMode: Record<ViewMode, ViewMode> = { tree: 'compact', compact: 'detailed', detailed: 'tree' };

	const onSwitchView = () => {
		const next = nextViewMode[viewMode];
		setViewMode(next);
		Storage.set('binViewMode', next);
	};

	const onSelectTree = (ids: string[], e: MouseEvent) => {
		e.stopPropagation();
		let next = [ ...selectedIds ];
		const allPresent = ids.every(id => next.includes(id));
		if (allPresent) {
			next = next.filter(id => !ids.includes(id));
		} else {
			next = [ ...new Set([ ...next, ...ids ]) ];
		};
		setSelectedIds(next);
	};

	const filterMouseDownHandler = useRef<((e: any) => void) | null>(null);
	const filterKeydownHandler = useRef<((e: any) => void) | null>(null);

	const onFilterShow = () => {
		if (!filterRef.current) {
			return;
		};

		filterRef.current.setActive(true);
		filterRef.current.focus();

		const container = U.Dom.getPageFlexContainer(isPopup);

		if (filterMouseDownHandler.current && container) {
			container.removeEventListener('mousedown', filterMouseDownHandler.current);
		};
		if (filterKeydownHandler.current) {
			window.removeEventListener('keydown', filterKeydownHandler.current);
		};

		filterMouseDownHandler.current = (e: any) => {
			const value = filterRef.current?.getValue();

			if (!value && !(e.target as HTMLElement)?.closest('.filter')) {
				onFilterHide();
				container?.removeEventListener('mousedown', filterMouseDownHandler.current);
			};
		};

		filterKeydownHandler.current = (e: any) => {
			keyboard.shortcut('escape', e, () => {
				onFilterHide();
				window.removeEventListener('keydown', filterKeydownHandler.current);
			});
		};

		container?.addEventListener('mousedown', filterMouseDownHandler.current);
		window.addEventListener('keydown', filterKeydownHandler.current);
	};

	const onFilterHide = () => {
		if (!filterRef.current) {
			return;
		};

		filterRef.current.setActive(false);
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

	const getDeleteTooltip = (): string => {
		if (!canDeleteSelection()) {
			return translate('binDeleteDisabledTooltip');
		};
		return translate('commonDeleteImmediately');
	};

	const onKeyDown = useCallback((e: KeyboardEvent) => {
		keyboard.shortcut('searchText', e, () => {
			e.preventDefault();
			onFilterShow();
		});
	}, []);

	const archiveKeydownHandler = useRef<((e: any) => void) | null>(null);

	useEffect(() => {
		analytics.event('ScreenBin');
		sidebar.rightPanelClose(isPopup, false);

		return () => {
			window.clearTimeout(filterTimeout.current);
			const cleanupEl = U.Dom.getPageFlexContainer(isPopup);
			if (filterMouseDownHandler.current && cleanupEl) {
				cleanupEl.removeEventListener('mousedown', filterMouseDownHandler.current);
			};
			if (filterKeydownHandler.current) {
				window.removeEventListener('keydown', filterKeydownHandler.current);
			};
		};
	}, []);

	useEffect(() => {
		archiveKeydownHandler.current = (e: any) => onKeyDown(e);
		window.addEventListener('keydown', archiveKeydownHandler.current);
		return () => {
			if (archiveKeydownHandler.current) {
				window.removeEventListener('keydown', archiveKeydownHandler.current);
			};
		};
	}, []);

	const isAllSelected = hasSelection && (selectedIds.length >= getRecordIds().length);
	const canDelete = canDeleteSelection();
	const isDetailed = viewMode === 'detailed';
	const switchIconMap = { tree: 'common/switchViewTree', compact: 'common/switchView', detailed: 'common/switchViewDetailed' };
	const switchTooltipMap = { tree: 'binSwitchToCompact', compact: 'binSwitchToDetailed', detailed: 'binSwitchToTree' };
	const cnWrapper = [ 'wrapper', ...(isDetailed ? [ 'isDetailed' ] : []) ];

	return (
		<>
			<Header
				{...props}
				component="mainArchive"
			/>

			<div ref={nodeRef} className={cnWrapper.join(' ')}>
				<div className="titleWrapper">
					<div className="side left">
						<Icon name="common/bin" size={32} color="default" />
						<Title text={translate('commonBin')} />
					</div>
					<div className="side right">
						{canWrite ? (
							<>
								{hasSelection ? (
									<>
										<Icon
											className="archiveAction"
											name="menu/action/restore"
											withBackground={true}
											tooltipParam={{ text: translate('commonRestore') }}
											onClick={onRestore}
										/>
										<Icon
											className={[ 'archiveAction', ((!canDelete || !hasSelection) ? 'isDisabled' : '') ].join(' ')}
											name="menu/action/remove"
											withBackground={true}
											tooltipParam={{ text: getDeleteTooltip() }}
											onClick={onRemove}
										/>
									</>
								) : ''}

								<Icon
									className="archiveAction"
									name={switchIconMap[viewMode]}
									withBackground={true}
									tooltipParam={{ text: translate(switchTooltipMap[viewMode]) }}
									onClick={onSwitchView}
								/>

								<Filter
									ref={filterRef}
									onChange={onFilterChange}
									placeholder={translate('commonSearchPlaceholder')}
									iconParam={{ name: 'common/search' }}
									tooltipParam={{ text: translate('commonSearch'), caption: keyboard.getCaption('searchText') }}
									onIconClick={onFilterShow}
									size={32}
								/>
							</>
						) : ''}
					</div>
				</div>

				{viewMode === 'tree' ? (
					<ArchiveListTree
						subId={subId}
						canWrite={canWrite}
						isShared={isShared}
						selectedIds={selectedIds}
						filterText={filterText}
						sortId={sortId}
						sortType={sortType}
						onSort={onSortChange}
						onSelectChange={onSelectTree}
						onSelectAll={onSelectAll}
						isAllSelected={isAllSelected}
					/>
				) : (
					<ListObject
						ref={listRef}
						subId={subId}
						rootId=""
						spaceId={S.Common.space}
						route={analytics.route.archive}
						columns={columns}
						filters={getFilters()}
						relationKeys={relationKeys}
						ignoreArchived={false}
						skipLayoutFilter={true}
						withDescription={isDetailed}
						iconSize={isDetailed ? 32 : null}
						rowHeight={isDetailed ? 64 : 40}
						emptyText={translate('pageMainArchiveEmpty')}
						defaultSortId={sortId}
						defaultSortType={sortType}
						onSort={onSortChange}
						selectable={canWrite}
						selectedIds={selectedIds}
						isAllSelected={isAllSelected}
						onSelect={onSelect}
						onSelectAll={onSelectAll}
						useInfiniteScroll={true}
						isPopup={isPopup}
					/>
				)}
			</div>

			<Footer {...props} component="mainObject" />
		</>
	);

});

export default PageMainArchive;
