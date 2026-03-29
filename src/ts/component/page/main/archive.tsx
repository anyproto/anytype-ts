import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle, useCallback, MouseEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Footer, Header, ListObject, Icon, Title, Filter } from 'Component';
import * as I from 'Interface';
import Storage from 'Lib/storage';

const PageMainArchive = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const { dateFormat } = S.Common;
	const nodeRef = useRef(null);
	const listRef = useRef(null);
	const filterRef = useRef(null);
	const [ selectedIds, setSelectedIds ] = useState<string[]>([]);
	const [ filterText, setFilterText ] = useState('');
	const [ isDetailed, setIsDetailed ] = useState(() => Boolean(Storage.get('binViewDetailed')));
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

	const onSwitchView = () => {
		const v = !isDetailed;

		setIsDetailed(v);
		Storage.set('binViewDetailed', v);
	};

	const onFilterShow = () => {
		if (!filterRef.current) {
			return;
		};

		filterRef.current.setActive(true);
		filterRef.current.focus();

		const containerEl = U.Dom.getPageFlexContainer(isPopup);
		const container = containerEl ? $(containerEl) : $();
		const win = $(window);

		container.off('mousedown.filter').on('mousedown.filter', (e: any) => {
			const value = filterRef.current?.getValue();

			if (!value && !$(e.target).parents('.filter').length) {
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

	useEffect(() => {
		analytics.event('ScreenBin');
		sidebar.rightPanelClose(isPopup, false);

		return () => {
			window.clearTimeout(filterTimeout.current);
			const cleanupEl = U.Dom.getPageFlexContainer(isPopup);
			if (cleanupEl) {
				$(cleanupEl).off('mousedown.filter');
			};
			$(window).off('keydown.filter');
		};
	}, []);

	useEffect(() => {
		const win = $(window);

		win.on('keydown.archive', (e: any) => onKeyDown(e));
		return () => { win.off('keydown.archive'); };
	}, []);

	const isAllSelected = hasSelection && (selectedIds.length >= getRecordIds().length);
	const canDelete = canDeleteSelection();
	const cnWrapper = [ 'wrapper' ];

	if (isDetailed) {
		cnWrapper.push('isDetailed');
	};

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
									name={isDetailed ? 'common/switchViewDetailed' : 'common/switchView'}
									withBackground={true}
									tooltipParam={{ text: translate('commonSwitchView') }}
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
					defaultSortId="lastModifiedDate"
					defaultSortType={I.SortType.Desc}
					selectable={canWrite}
					selectedIds={selectedIds}
					isAllSelected={isAllSelected}
					onSelect={onSelect}
					onSelectAll={onSelectAll}
					useInfiniteScroll={true}
					isPopup={isPopup}
				/>
			</div>

			<Footer {...props} component="mainObject" />
		</>
	);

}));

export default PageMainArchive;
