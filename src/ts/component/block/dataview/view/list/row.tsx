import React, { forwardRef, useEffect, useLayoutEffect, useRef, useState, useImperativeHandle, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cell, DropTarget, Icon, IconObject, SelectionTarget } from 'Component';
import * as I from 'Interface';

interface Props extends I.ViewComponent {
	style?: any;
};

const ListRow = forwardRef<I.RowRef, Props>((props, ref) => {

	const {
		rootId, block, recordId, style, getRecord, getView, onRefCell, onContext, getIdPrefix, isInline, isCollection,
		onDragRecordStart, onSelectToggle, onEditModeClick, canCellEdit, onCellClick,
	} = props;
	const [ isEditing, setIsEditing ] = useState(false);
	const nodeRef = useRef(null);
	const resizeRef = useRef(null);
	const view = getView();

	const resize = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const cells = U.Dom.selectAll('.cellContent', node);
		const first = U.Dom.select('.cellContent:not(.isEmpty)', node);

		cells.forEach(el => U.Dom.removeClass(el, 'first'));
		if (first) {
			U.Dom.addClass(first, 'first');
		};

		const rightSide = U.Dom.select('.side.right', node) as HTMLElement;
		if (!rightSide) {
			return;
		};

		const wrappers = Array.from(rightSide.children).filter(
			el => (el as HTMLElement).classList.contains('cellWrapper') &&
			      !(el as HTMLElement).classList.contains('isEmpty')
		) as HTMLElement[];

		if (wrappers.length < 2) {
			return;
		};

		// Only clear previous water-fill flex when it was actually set.
		// An unconditional clear changes layout and triggers a spurious second
		// ResizeObserver callback on every tick.
		if (wrappers.some(el => el.style.flex)) {
			wrappers.forEach(el => { el.style.flex = ''; });
		};

		// Compute available space from the container, not from rightSide.offsetWidth.
		// rightSide.offsetWidth is unreliable because inner elements have
		// max-width:100% which creates a circular reference when the right side
		// has no fixed width, causing it to collapse to near-zero.
		const sidesEl = rightSide.parentElement as HTMLElement;
		if (!sidesEl) {
			return;
		};
		const leftSideEl = U.Dom.select('.side.left', sidesEl) as HTMLElement;
		if (!leftSideEl) {
			return;
		};

		const sidesWidth = sidesEl.offsetWidth;
		const available = Math.max(0, sidesWidth - leftSideEl.offsetWidth - 12);
		if (!available) {
			return;
		};

		// Measure natural widths using an off-screen clone so we never mutate live
		// elements. Mutating live widths mid-render interferes with concurrent
		// getBoundingClientRect calls from menu/popup positioning code.
		// .name is intentionally left constrained to max-width:300px so text cells
		// (description) measure at their visual cap and don't receive excess space.
		const clone = rightSide.cloneNode(true) as HTMLElement;
		clone.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';
		document.body.appendChild(clone);

		const cloneWrappers = Array.from(clone.children).filter(
			el => el.classList.contains('cellWrapper') && !el.classList.contains('isEmpty')
		) as HTMLElement[];

		cloneWrappers.forEach(el => { el.style.flex = 'none'; el.style.width = 'max-content'; el.style.maxWidth = 'none'; });
		Array.from(clone.querySelectorAll<HTMLElement>('.cellContent, .tagItem, .element, .over, .wrap')).forEach(el => {
			el.style.width = 'max-content';
			el.style.maxWidth = 'none';
		});

		const natural = cloneWrappers.map(el => el.offsetWidth);
		clone.remove();

		if (natural.length !== wrappers.length) {
			return;
		};

		const naturalCapped = natural.map(w => Math.min(w, 300));
		const total = naturalCapped.reduce((s, w) => s + w, 0);
		if (total <= available) {
			return;
		};

		// Water-fill: items that fit within their equal share keep their natural width;
		// the remaining space is then split equally among items that need more.
		const assigned: number[] = new Array(wrappers.length).fill(-1);
		let remaining = available;
		let slots = wrappers.length;

		const sorted = naturalCapped.map((_, i) => i).sort((a, b) => naturalCapped[a] - naturalCapped[b]);

		for (const idx of sorted) {
			const share = remaining / slots;
			if (naturalCapped[idx] <= share) {
				assigned[idx] = naturalCapped[idx];
				remaining -= naturalCapped[idx];
				slots--;
			} else {
				break;
			};
		};

		const equalShare = remaining / slots;
		wrappers.forEach((el, i) => {
			el.style.flex = `0 0 ${assigned[i] === -1 ? equalShare : assigned[i]}px`;
		});
	};

	useLayoutEffect(() => {
		resizeRef.current = resize;
	});

	useEffect(() => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};
		const target = (U.Dom.select('.sides', node) as HTMLElement) || node;
		const ro = new ResizeObserver(() => resizeRef.current());
		ro.observe(target);
		return () => ro.disconnect();
	}, []);

	useImperativeHandle(ref, () => ({
		setIsEditing,
	}));

	if (!view) {
		return null;
	};

	const idPrefix = getIdPrefix();
	const subId = S.Record.getSubId(rootId, block.id);
	const record = getRecord(recordId);
	const cn = [ 'row' ];
	const relations = view.getVisibleRelations();
	const nameIndex = relations.findIndex(it => it.relationKey == 'name');
	const isRegular = view.listSize == I.ListSize.Regular;
	const selection = S.Common.getRef('selectionProvider');

	const left = [];
	const right = [];

	relations.forEach((el, idx) => {
		if (isRegular) {
			if (el.relationKey == 'name') {
				left.push(el);
			} else
			if (el.relationKey != 'description') {
				right.push(el);
			};
		} else {
			if (idx <= nameIndex) {
				left.push(el);
			} else {
				right.push(el);
			};
		};
	});

	// Subscriptions
	const { hideIcon } = view;
	const { done } = record;

	if (U.Object.isTaskLayout(record.layout) && done) {
		cn.push('isDone');
	};

	if (isEditing) {
		cn.push('editModeOn');
	};

	const onClick = (e: any) => {
		e.preventDefault();

		const cb = {
			0: () => U.Object.openConfig(e, record),
			1: () => U.Object.openConfig(e, record),
			2: () => onContext(e, record.id)
		};

		const ids = selection?.get(I.SelectType.Record) || [];
		if (((e.ctrlKey || e.metaKey) && (ids.length > 1)) || keyboard.isSelectionClearDisabled) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	const onCellClickHandler = (e: MouseEvent, vr: I.ViewRelation) => {
		const relation = S.Record.getRelationByKey(vr.relationKey);

		if (!relation) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		onCellClick(e, relation.relationKey, record.id);
	};

	// In Regular mode, override getView to always hide the icon inside the name Cell
	// since we render it separately at the row level
	const getViewForCell = isRegular
		? () => ({ ...view, hideIcon: true })
		: getView;

	const mapper = (vr: any, i: number) => {
		const relation = S.Record.getRelationByKey(vr.relationKey);
		const id = Relation.cellId(idPrefix, relation.relationKey, record.id);
		const isName = relation.relationKey == 'name';
		const ccn = ['cellWrapper'];
		const iconSize = relation.relationKey == 'name' ? 20 : 16;
		const canEdit = canCellEdit(relation, record);

		if (isName) {
			ccn.push('isName');
		} else {
			if (!Relation.checkRelationValue(relation, record[relation.relationKey])) {
				ccn.push('isEmpty');
			};
		};

		return (
			<div
				className={ccn.join(' ')}
				key={`list-cell-${relation.relationKey}`}
			>
				<Cell
					elementId={id}
					ref={ref => onRefCell(ref, id)}
					{...props}
					getRecord={() => record}
					getView={getViewForCell}
					subId={subId}
					relationKey={relation.relationKey}
					viewType={view.type}
					idPrefix={idPrefix}
					onClick={e => onCellClickHandler(e, relation)}
					isInline={true}
					tooltipParam={{ text: relation.name, typeX: I.MenuDirection.Left, offsetX: 14 }}
					arrayLimit={2}
					iconSize={iconSize}
					size={iconSize}
					withName={true}
					noInplace={!isName}
					editModeOn={isEditing}
				/>

				{isName && canEdit ? (
					<Icon
						name="common/edit"
						className={[ 'edit', (isEditing ? 'enabled' : '') ].join(' ')}
						onClick={e => onEditModeClick(e, recordId)}
					/>
				) : ''}
			</div>
		);
	};

	let content = null;

	if (isRegular) {
		let rowIcon = null;

		if (!hideIcon) {
			rowIcon = (
				<IconObject
					id={`list-icon-${record.id}`}
					object={record}
					size={32}
					canEdit={!props.readonly && U.Object.isTaskLayout(record.layout)}
					noClick={true}
				/>
			);
		};

		content = (
			<div className="regularContent">
				{rowIcon}
				<div className="sides">
					<div className="line first">
						<div className="side left">
							{left.map(mapper)}
						</div>
						<div className="side right">
							{right.map(mapper)}
						</div>
					</div>
					{record.description ? (
						<div className="line second">
							<div className="description">{record.description}</div>
						</div>
					) : ''}
				</div>
			</div>
		);
	} else {
		content = (
			<div className="sides">
				<div
					className={[ 'side', 'left', (left.length > 1 ? 's60' : '') ].join(' ')}
				>
					{left.map(mapper)}
				</div>
				<div className="side right">
					{right.map(mapper)}
				</div>
			</div>
		);
	};

	if (!isInline) {
		content = (
			<>
				<Icon
					name="control/dataview/dnd"
					className="drag"
					width={7}
					height={12}
					draggable={true}
					onClick={e => onSelectToggle(e, record.id)}
					onDragStart={e => onDragRecordStart(e, record.id)}
					onMouseEnter={() => keyboard.setSelectionClearDisabled(true)}
					onMouseLeave={() => keyboard.setSelectionClearDisabled(false)}
				/>
				<DropTarget {...props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
					<SelectionTarget id={record.id} type={I.SelectType.Record}>
						{content}
					</SelectionTarget>
				</DropTarget>
			</>
		);
	};

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				id={`record-${record.id}`}
				ref={nodeRef} 
				className={cn.join(' ')}
				style={style}
				onClick={e => onClick(e)}
				onContextMenu={e => onContext(e, record.id)}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.1 },
				})}
			>
				{content}
			</motion.div>
		</AnimatePresence>
	);

});

export default ListRow;