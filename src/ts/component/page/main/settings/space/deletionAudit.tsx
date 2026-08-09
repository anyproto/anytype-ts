import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle, MouseEvent } from 'react';
import { AutoSizer, WindowScroller, List, InfiniteLoader } from 'react-virtualized';
import { Header, Footer, IconObject, ObjectName, Title, Label, Loader, EmptySearch } from 'Component';
import * as I from 'Interface';

const LIMIT = 50;
const ROW_HEIGHT = 42;

// How much of an id identifies a row that cannot name itself. Long enough to be
// distinguishing in a list, short enough to read; the full id is a hover away.
const ID_TAIL = 5;

// Passing keys REPLACES the backend's default set rather than extending it
// (core/object.go:869), so everything rendered has to be named here.
// id, deletedBy, deletedDate and isUninstalled come back regardless.
//
// The icon* keys are not in the backend default set. An uninstalled type keeps its
// tree and therefore its real icon, and IconObject reads these rather than deriving
// everything from layout — without them a removed "Task" falls back to a generic glyph.
// Deleted objects carry none of them and fall through to U.Object.defaultIcon.
const KEYS = [
	'name', 'creator', 'createdDate', 'addedDate', 'createdInContext', 'createdInContextRef',
	'lastModifiedBy', 'lastModifiedDate', 'type', 'resolvedLayout', 'sizeInBytes',
	'sourceObject', 'deletionChangeId',
	'iconName', 'iconEmoji', 'iconOption', 'iconImage',
];

const css: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 20% 16% 20%' };

const PageMainSettingsSpaceDeletionAudit = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { isPopup } = props;
	const { space, dateFormat } = S.Common;
	const [ records, setRecords ] = useState<any[]>([]);
	const [ total, setTotal ] = useState(0);
	const [ isLoading, setIsLoading ] = useState(true);
	const listRef = useRef(null);

	// Bumped only when the space changes. Concurrent pagination requests for the current
	// space all stay valid; everything still in flight from a previous space is dropped.
	const generationRef = useRef(0);

	const load = (offset: number, limit: number, callBack?: () => void) => {
		const generation = generationRef.current;

		C.ObjectDeletionAudit(space, KEYS, offset, limit, (message: any) => {
			if (generation != generationRef.current) {
				return;
			};

			setIsLoading(false);

			if (message.error.code) {
				callBack?.();
				return;
			};

			const list = message.records || [];

			setTotal(message.total);
			setRecords(prev => {
				const next = [ ...prev ];
				list.forEach((it: any, i: number) => next[offset + i] = it);
				return next;
			});

			callBack?.();
		});
	};

	useEffect(() => {
		generationRef.current++;

		setRecords([]);
		setTotal(0);
		setIsLoading(true);

		load(0, LIMIT);
	}, [ space ]);

	useEffect(() => {
		analytics.event('ScreenSettingsSpaceDeletionAudit');
	}, []);

	useImperativeHandle(ref, () => ({
		resize: () => listRef.current?.recomputeRowHeights(),
	}));

	const loadMoreRows = ({ startIndex, stopIndex }): Promise<void> => {
		return new Promise<void>(resolve => load(startIndex, stopIndex - startIndex + 1, () => resolve()));
	};

	const onTooltipShow = (e: MouseEvent, text: string) => {
		Preview.tooltipShow({ text, element: e.currentTarget as HTMLElement, typeY: I.MenuDirection.Bottom });
	};

	const onTooltipHide = () => {
		Preview.tooltipHide(false);
	};

	const shortId = (id: string): string => String(id || '').slice(-ID_TAIL);

	// Every absent value explains itself, so an empty cell never reads as a bug.
	// Uninstalled rows keep their whole creation half and never reach this.
	const renderDash = () => (
		<span
			className="dash"
			onMouseEnter={e => onTooltipShow(e, translate('pageSettingsSpaceDeletionAuditMissingTooltip'))}
			onMouseLeave={onTooltipHide}
		>
			&mdash;
		</span>
	);

	// The only truthful identity a degraded row has: no name, no type, no layout.
	const renderIdChip = (id: string) => (
		<span
			className="idChip"
			onMouseEnter={e => onTooltipShow(e, id)}
			onMouseLeave={onTooltipHide}
			onClick={() => {
				onTooltipHide();
				U.Common.copyToast(translate('commonId'), id);
			}}
		>
			{shortId(id)}
		</span>
	);

	const renderParticipant = (id: string) => {
		if (!id) {
			return renderDash();
		};

		// A participant who left the space resolves empty. Fall back to a shortened
		// identity rather than a blank cell — same grammar as the object id chip.
		const participant = U.Space.getParticipant(id);
		if (!participant) {
			return (
				<span
					className="idChip"
					onMouseEnter={e => onTooltipShow(e, id)}
					onMouseLeave={onTooltipHide}
				>
					{shortId(id)}
				</span>
			);
		};

		return (
			<div className="flex">
				<IconObject object={participant} size={18} />
				<ObjectName object={participant} />
			</div>
		);
	};

	const renderRow = (index: number, style: React.CSSProperties) => {
		const record = records[index];

		if (!record) {
			return <div className="row isPlaceholder" style={{ ...css, ...style }} />;
		};

		// Two different questions. isUninstalled decides the verb, the badge and whether a
		// name may be shown; isDegraded decides whether the row can describe itself at all.
		// §2.1 of the spec guarantees uninstalled rows are never degraded — the guard states
		// that invariant rather than relying on it.
		const isUninstalled = Boolean(record.isUninstalled);
		const isDegraded = !isUninstalled && (undefined === record.resolvedLayout);

		const type = isDegraded ? null : S.Record.getTypeById(record.type);
		const typeName = type ? type.name : '';

		// Show the real name when there is one. Only uninstalled records carry one, and
		// falling back to a generic "Type" when "Task" is available throws away the point
		// of the row.
		const label = (isUninstalled && record.name) ? record.name : typeName;

		const size = record.sizeInBytes ? U.File.size(Number(record.sizeInBytes)) : '';
		const removed = record.deletedDate ? U.Date.dateWithFormat(dateFormat, Number(record.deletedDate)) : '';
		const verb = translate(isUninstalled ? 'pageSettingsSpaceDeletionAuditUninstalled' : 'pageSettingsSpaceDeletionAuditDeleted');

		// IconObject renders the ghost icon off isDeleted, which is the honest icon for a
		// row whose layout is unknown — anything else would assert a type we do not have.
		const iconObject: any = isDegraded ? { id: record.id, isDeleted: true } : {
			id: record.id,
			layout: Number(record.resolvedLayout) || I.ObjectLayout.Page,
			type: record.type,
			iconName: record.iconName,
			iconEmoji: record.iconEmoji,
			iconOption: record.iconOption,
			iconImage: record.iconImage,
		};

		const cn = [ 'row', (isUninstalled ? 'isUninstalled' : 'isDeleted') ];

		let name = null;
		if (label) {
			name = <span className="name">{label}</span>;
		} else
		if (isDegraded) {
			name = renderIdChip(record.id);
		} else {
			name = renderDash();
		};

		return (
			<div className={cn.join(' ')} style={{ ...css, ...style }}>
				<div className="cell">
					<div className="cellContent isName">
						<div className="flex">
							<div
								className="iconWrap"
								onMouseEnter={e => onTooltipShow(e, isDegraded ? translate('pageSettingsSpaceDeletionAuditMissingTooltip') : verb)}
								onMouseLeave={onTooltipHide}
							>
								<IconObject object={iconObject} size={20} />
							</div>

							{name}

							{size ? <span className="size">{size}</span> : ''}

							{isUninstalled ? (
								<span
									className="stackBadge"
									onMouseEnter={e => onTooltipShow(e, verb)}
									onMouseLeave={onTooltipHide}
								>
									{translate('pageSettingsSpaceDeletionAuditUninstalledBadge')}
								</span>
							) : ''}
						</div>
					</div>
				</div>

				<div className="cell c-removedBy">
					<div className="cellContent">{renderParticipant(record.deletedBy)}</div>
				</div>

				<div className="cell c-removed">
					<div className="cellContent">{removed ? removed : renderDash()}</div>
				</div>

				<div className="cell c-createdBy">
					<div className="cellContent">{renderParticipant(record.creator)}</div>
				</div>
			</div>
		);
	};

	const scrollContainer = U.Dom.getScrollContainer(isPopup);
	const columns = [
		translate('pageSettingsSpaceDeletionAuditColumnObject'),
		translate('pageSettingsSpaceDeletionAuditColumnRemovedBy'),
		translate('pageSettingsSpaceDeletionAuditColumnRemoved'),
		translate('pageSettingsSpaceDeletionAuditColumnCreatedBy'),
	];

	let body = null;

	// The first call in a space walks the whole settings tree and every uninstalled
	// object's tree, so this is a real state rather than a formality.
	if (isLoading && !records.length) {
		body = <Loader />;
	} else
	if (!total) {
		body = <EmptySearch text={translate('pageSettingsSpaceDeletionAuditEmpty')} />;
	} else {
		body = (
			<InfiniteLoader
				isRowLoaded={({ index }) => !!records[index]}
				loadMoreRows={loadMoreRows}
				rowCount={total}
				threshold={10}
			>
				{({ onRowsRendered }) => (
					<WindowScroller scrollElement={scrollContainer}>
						{({ height, isScrolling, scrollTop }) => (
							<AutoSizer disableHeight={true}>
								{({ width }) => (
									<List
										ref={listRef}
										autoHeight={true}
										height={Number(height) || 0}
										width={Number(width) || 0}
										isScrolling={isScrolling}
										rowCount={total}
										rowHeight={ROW_HEIGHT}
										onRowsRendered={onRowsRendered}
										overscanRowCount={10}
										scrollTop={scrollTop}
										rowRenderer={({ key, index, style }) => (
											<div key={key}>
												{renderRow(index, style)}
											</div>
										)}
									/>
								)}
							</AutoSizer>
						)}
					</WindowScroller>
				)}
			</InfiniteLoader>
		);
	};

	return (
		<>
			<Header {...props} component="mainSettings" />

			<div className="wrapper">
				<div className="titleWrapper">
					<Title text={translate('pageSettingsSpaceDeletionAudit')} />
					<Label className="description" text={translate('pageSettingsSpaceDeletionAuditDescription')} />
				</div>

				<div className="listObject deletionAudit">
					<div className="table">
						<div className="row isHead" style={css}>
							{columns.map((label, i) => (
								<div key={i} className="cell isHead">
									<div className="name">{label}</div>
								</div>
							))}
						</div>

						{body}
					</div>
				</div>
			</div>

			<Footer component="mainObject" {...props} />
		</>
	);

});

export default PageMainSettingsSpaceDeletionAudit;
