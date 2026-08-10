import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle, MouseEvent } from 'react';
import { Header, Footer, Button, IconObject, ObjectName, Title, Label, Loader, EmptySearch } from 'Component';
import * as I from 'Interface';

// Paged behind an explicit "Show more" rather than infinite scroll. A channel with a long
// removal history made scroll-driven loading unusable — the list kept fetching as you
// scrolled through it, and there was no way to reach the bottom. Loading on request keeps
// the page a fixed size until the user asks for more.
const LIMIT = 100;

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
	'lastModifiedBy', 'lastModifiedDate', 'type', 'resolvedLayout', 'layout', 'sizeInBytes',
	'sourceObject', 'deletionChangeId',
	'iconName', 'iconEmoji', 'iconOption', 'iconImage',
	// IconObject's Relation branch renders off these two rather than the icon* keys
	// (iconObject.tsx:374). Without them an uninstalled property falls back to the
	// generic relation glyph instead of one matching its format.
	'relationKey', 'relationFormat',
];

// The date column is the widest of the three fixed ones: a long-form date like
// "February 25, 2026" is the longest value any of them holds, and 16% clipped it.
const css: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 19% 19% 19%' };

// What kind of thing a row was, named from its layout.
//
// This takes precedence over the type object's own name for these three layouts: the
// bundled types still carry their pre-rename names ("Relation", "Relation option"), and
// reading them straight would leak that vocabulary back into the UI. It also keeps the
// row honest when the type object cannot be resolved at all, which happens whenever the
// type was itself removed.
const layoutName = (layout: I.ObjectLayout): string => {
	switch (layout) {
		case I.ObjectLayout.Type: return U.Common.plural(1, translate('pluralObjectType'));
		case I.ObjectLayout.Relation: return U.Common.plural(1, translate('pluralProperty'));
		case I.ObjectLayout.Option: return U.Common.plural(1, translate('pluralPropertyOption'));
		default: return '';
	};
};

const PageMainSettingsSpaceDeletionAudit = forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { space, dateFormat, timeFormat } = S.Common;
	const [ records, setRecords ] = useState<any[]>([]);
	const [ total, setTotal ] = useState(0);
	const [ isLoading, setIsLoading ] = useState(true);

	// Moderators, or either side of a one-to-one. The sidebar entry and the Bin button are
	// hidden for everyone else, but neither is a control: the route is reachable by hand,
	// and the settings router only checks that the page id is known. So the gate lives here
	// as well, and this one is the one that counts — nothing is requested before it passes.
	const canView = U.Space.canMyParticipantSeeDeletionAudit();

	// Bumped when the space changes, so a reply still in flight from the previous space is
	// dropped instead of appending its rows onto this one's list.
	const generationRef = useRef(0);

	// Always appends: the offset is whatever we already hold, so a page can only ever
	// extend the list. Nothing reads by index, so there are no holes to leave.
	const load = (offset: number) => {
		const generation = generationRef.current;

		setIsLoading(true);

		C.ObjectDeletionAudit(space, KEYS, offset, LIMIT, (message: any) => {
			if (generation != generationRef.current) {
				return;
			};

			setIsLoading(false);

			if (message.error.code) {
				return;
			};

			const list = message.records || [];

			setTotal(message.total);
			setRecords(prev => {
				if (!offset) {
					return list;
				};

				// Offsets are only stable while nothing is being removed. If a removal lands
				// between two pages the window shifts by one and the next page repeats a row —
				// which would collide on the React key and render the same removal twice.
				// Dropping ids we already hold is cheaper than re-fetching from zero.
				const seen = new Set(prev.map(it => it.id));
				return prev.concat(list.filter((it: any) => !seen.has(it.id)));
			});
		});
	};

	useEffect(() => {
		// Bounce a hand-typed route rather than rendering an empty shell, and do it
		// before any request goes out.
		if (!canView) {
			U.Space.openDashboard();
			return;
		};

		generationRef.current++;

		setRecords([]);
		setTotal(0);

		load(0);
	}, [ space, canView ]);

	useEffect(() => {
		if (canView) {
			analytics.event('ScreenSettingsSpaceDeletionAudit');
		};
	}, []);

	// Rows are plain DOM at their natural height, so there is nothing to recompute.
	useImperativeHandle(ref, () => ({
		resize: () => {},
	}));

	const onTooltipShow = (e: MouseEvent, text: string) => {
		Preview.tooltipShow({ text, element: e.currentTarget as HTMLElement, typeY: I.MenuDirection.Bottom });
	};

	const onTooltipHide = () => {
		Preview.tooltipHide(false);
	};

	// Leading ellipsis marks it as a tail, not a whole id.
	const shortId = (id: string): string => `…${String(id || '').slice(-ID_TAIL)}`;

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

		// Display names are not unique and can be changed at will, which is a poor basis for
		// an audit trail. resolvedName is the globalName when there is one, falling back to
		// the raw identity — either way, the thing that actually identifies the account.
		const identity = participant.resolvedName;

		// What gets copied carries all three: the display name so a human reading it knows
		// who is meant, the globalName to address the account, and the raw identity because
		// that is the only part that is stable and unique. Accounts without a globalName
		// drop the parentheses rather than showing an empty pair.
		const copyText = participant.globalName
			? `${participant.name}. ${participant.globalName} (${participant.identity})`
			: `${participant.name}. ${participant.identity}`;

		return (
			<div
				className="flex"
				onMouseEnter={identity ? (e => onTooltipShow(e, identity)) : undefined}
				onMouseLeave={identity ? onTooltipHide : undefined}
				onClick={() => {
					onTooltipHide();
					U.Common.copyToast(participant.name, copyText);
				}}
			>
				<IconObject object={participant} size={18} />
				<ObjectName object={participant} />
			</div>
		);
	};

	const renderRow = (record: any) => {
		// Two different questions. isUninstalled decides whether a name may be shown and
		// whether the row may claim permanence; isDegraded decides whether the row can
		// describe itself at all. §2.1 of the spec guarantees uninstalled rows are never
		// degraded — the guard states that invariant rather than relying on it.
		const isUninstalled = Boolean(record.isUninstalled);

		// resolvedLayout is the authority, but fall back to layout before giving up:
		// collapsing a missing value straight to Page (0) is silent and wrong — it renders
		// a document glyph for something that was a type or a property.
		let layout = undefined;
		if (undefined !== record.resolvedLayout) {
			layout = Number(record.resolvedLayout);
		} else
		if (undefined !== record.layout) {
			layout = Number(record.layout);
		};

		const isDegraded = !isUninstalled && (undefined === layout);

		const type = S.Record.getTypeById(record.type);
		const typeName = layoutName(layout) || (type ? type.name : '');

		// Only uninstalled records keep a name. A deleted row has nothing but its kind.
		const label = (isUninstalled && record.name) ? record.name : '';

		const size = record.sizeInBytes ? U.File.size(Number(record.sizeInBytes)) : '';
		const removedDate = Number(record.deletedDate) || 0;
		const removed = removedDate ? U.Date.dateWithFormat(dateFormat, removedDate) : '';
		// The cell shows the date alone; the time only matters when you are reconstructing
		// the order of a single day's removals, so it lives on hover.
		const removedFull = removedDate ? [ removed, U.Date.timeWithFormat(timeFormat, removedDate) ].join(', ') : '';
		// Only a deleted row makes a claim about permanence. An uninstalled type or property
		// makes none: there is no reinstall path in the client yet, so promising one would
		// be worse than saying nothing. Its kind is already visible next to its name.
		let iconTooltip = '';
		if (isDegraded) {
			iconTooltip = translate('pageSettingsSpaceDeletionAuditMissingTooltip');
		} else
		if (!isUninstalled) {
			iconTooltip = translate('pageSettingsSpaceDeletionAuditDeleted');
		};

		// IconObject renders the ghost icon off isDeleted, which is the honest icon for a
		// row whose layout is unknown — anything else would assert a type we do not have.
		const iconObject: any = (undefined === layout) ? { id: record.id, isDeleted: true } : {
			id: record.id,
			layout,
			type: record.type,
			iconName: record.iconName,
			iconEmoji: record.iconEmoji,
			iconOption: record.iconOption,
			iconImage: record.iconImage,
			relationKey: record.relationKey,
			relationFormat: Number(record.relationFormat) || I.RelationType.LongText,
		};

		const cn = [ 'row', (isUninstalled ? 'isUninstalled' : 'isDeleted') ];

		// A named row still has to say what kind of thing it was, so the type trails the
		// name in parentheses rather than taking a column of its own — "Crypto (Object
		// Type)". Unnamed rows have only the kind, and show it alone.
		let name = null;
		if (label) {
			name = (
				<span className="nameWrap">
					<span className="name">{label}</span>
					{typeName ? <span className="typeName">({typeName})</span> : ''}
				</span>
			);
		} else
		if (typeName) {
			name = <span className="name">{typeName}</span>;
		} else
		if (isDegraded) {
			name = renderIdChip(record.id);
		} else {
			name = renderDash();
		};

		return (
			<div key={record.id} className={cn.join(' ')} style={css}>
				<div className="cell">
					<div className="cellContent isName">
						<div className="flex">
							<div
								className="iconWrap"
								onMouseEnter={iconTooltip ? (e => onTooltipShow(e, iconTooltip)) : undefined}
								onMouseLeave={iconTooltip ? onTooltipHide : undefined}
							>
								<IconObject object={iconObject} size={20} />
							</div>

							{name}

							{size ? <span className="size">{size}</span> : ''}
						</div>
					</div>
				</div>

				<div className="cell c-removedBy">
					<div className="cellContent">{renderParticipant(record.deletedBy)}</div>
				</div>

				<div className="cell c-removed">
					<div className="cellContent">
						{removed ? (
							<span
								onMouseEnter={e => onTooltipShow(e, removedFull)}
								onMouseLeave={onTooltipHide}
							>
								{removed}
							</span>
						) : renderDash()}
					</div>
				</div>

				<div className="cell c-createdBy">
					<div className="cellContent">{renderParticipant(record.creator)}</div>
				</div>
			</div>
		);
	};

	// The effect above is already navigating away; render nothing in the meantime so no
	// part of the audit is ever painted for someone who may not see it.
	if (!canView) {
		return null;
	};

	const columns = [
		translate('pageSettingsSpaceDeletionAuditColumnObject'),
		translate('pageSettingsSpaceDeletionAuditColumnRemovedBy'),
		translate('pageSettingsSpaceDeletionAuditColumnRemoved'),
		translate('pageSettingsSpaceDeletionAuditColumnCreatedBy'),
	];

	const hasMore = records.length < total;

	let body = null;

	// The first call in a space walks the whole settings tree and every uninstalled
	// object's tree, so this is a real state rather than a formality. Later pages keep
	// the rows on screen and put the wait on the button instead.
	if (isLoading && !records.length) {
		body = <Loader />;
	} else
	if (!total) {
		body = <EmptySearch text={translate('pageSettingsSpaceDeletionAuditEmpty')} />;
	} else {
		body = records.map(renderRow);
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

					{hasMore ? (
						<div className="showMore">
							<Button
								text={translate('commonShowMore')}
								color="blank"
								className={isLoading ? 'isDisabled' : ''}
								onClick={() => load(records.length)}
							/>
						</div>
					) : ''}
				</div>
			</div>

			<Footer component="mainObject" {...props} />
		</>
	);

});

export default PageMainSettingsSpaceDeletionAudit;
