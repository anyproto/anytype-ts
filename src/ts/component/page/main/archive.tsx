import React, { forwardRef, useRef, useState, useEffect, useCallback, MouseEvent } from 'react';
import { Footer, Header, Icon, Title, Filter } from 'Component';
import ArchiveListTree from './archiveListTree';
import * as I from 'Interface';
import Storage from 'Lib/storage';

type ViewMode = 'compact' | 'detailed';

const PageMainArchive = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const filterRef = useRef(null);
	const [ selectedIds, setSelectedIds ] = useState<string[]>([]);
	const [ visibleIds, setVisibleIds ] = useState<string[]>([]);
	const [ filterText, setFilterText ] = useState('');
	const [ viewMode, setViewMode ] = useState<ViewMode>(() => {
		const saved = Storage.get('binViewMode');
		return (saved === 'compact' || saved === 'detailed') ? saved : 'compact';
	});
	const [ sortId, setSortId ] = useState('lastModifiedDate');
	const [ sortType, setSortType ] = useState(I.SortType.Desc);
	const filterTimeout = useRef(0);
	const subId = J.Constant.subId.archive;
	const spaceview = U.Space.getSpaceview();
	const isShared = spaceview.isShared;
	const canModerate = U.Space.canMyParticipantModerate();
	const participantId = U.Space.getCurrentParticipantId();
	const canWrite = U.Space.canMyParticipantWrite();
	const hasSelection = selectedIds.length > 0;

	const canDeleteSelection = (): boolean => {
		if (canModerate || !isShared) {
			return true;
		};

		return selectedIds.every(id => {
			const obj = S.Detail.get(subId, id, [ 'creator' ]);
			return obj.creator === participantId;
		});
	};

	const onSelectAll = () => {
		if (hasSelection) {
			setSelectedIds([]);
		} else {
			setSelectedIds(visibleIds);
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

	const nextViewMode: Record<ViewMode, ViewMode> = { compact: 'detailed', detailed: 'compact' };

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
			U.Dom.removeEvent(container, 'mousedown', filterMouseDownHandler.current);
		};
		if (filterKeydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', filterKeydownHandler.current);
		};

		filterMouseDownHandler.current = (e: any) => {
			const value = filterRef.current?.getValue();

			if (!value && !(e.target as HTMLElement)?.closest('.filter')) {
				onFilterHide();
				if (container) {
					U.Dom.removeEvent(container, 'mousedown', filterMouseDownHandler.current);
				};
			};
		};

		filterKeydownHandler.current = (e: any) => {
			keyboard.shortcut('escape', e, () => {
				onFilterHide();
				U.Dom.removeEvent(window, 'keydown', filterKeydownHandler.current);
			});
		};

		if (container) {
			U.Dom.addEvent(container, 'mousedown', filterMouseDownHandler.current);
		};
		U.Dom.addEvent(window, 'keydown', filterKeydownHandler.current);
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
				U.Dom.removeEvent(cleanupEl, 'mousedown', filterMouseDownHandler.current);
				filterMouseDownHandler.current = null;
			};

			if (filterKeydownHandler.current) {
				U.Dom.removeEvent(window, 'keydown', filterKeydownHandler.current);
				filterKeydownHandler.current = null;
			};
		};
	}, []);

	useEffect(() => {
		archiveKeydownHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', archiveKeydownHandler.current);
		return () => {
			if (archiveKeydownHandler.current) {
				U.Dom.removeEvent(window, 'keydown', archiveKeydownHandler.current);
			};
		};
	}, []);

	const isAllSelected = hasSelection && (visibleIds.length > 0) && (selectedIds.length >= visibleIds.length);
	const canDelete = canDeleteSelection();
	const isDetailed = viewMode === 'detailed';
	const switchIconMap = { compact: 'common/switchView', detailed: 'common/switchViewDetailed' };
	const switchTooltipMap = { compact: 'binSwitchToDetailed', detailed: 'binSwitchToCompact' };
	const cnWrapper = [ 'wrapper', ...(isDetailed ? [ 'isDetailed' ] : []) ];

	return (
		<>
			<Header
				{...props}
				component="mainArchive"
			/>

			<div className={cnWrapper.join(' ')}>
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

				<ArchiveListTree
					subId={subId}
					canWrite={canWrite}
					isShared={isShared}
					isPopup={isPopup}
					isDetailed={isDetailed}
					selectedIds={selectedIds}
					filterText={filterText}
					sortId={sortId}
					sortType={sortType}
					onSort={onSortChange}
					onSelectChange={onSelectTree}
					onSelectAll={onSelectAll}
					isAllSelected={isAllSelected}
					onVisibleIdsChange={setVisibleIds}
				/>
			</div>

			<Footer {...props} component="mainObject" />
		</>
	);

});

export default PageMainArchive;
