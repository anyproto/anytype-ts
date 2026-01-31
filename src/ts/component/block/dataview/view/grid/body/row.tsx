import React, { forwardRef, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { observer } from 'mobx-react';
import { DropTarget, Icon, SelectionTarget } from 'Component';
import { I, U, J, keyboard } from 'Lib';
import Cell from './cell';

interface Props extends I.ViewComponent {
	style?: any;
	cellPosition?: (cellId: string) => void;
	onRefCell?(ref: any, id: string): void;
	getColumnWidths?: (relationId: string, width: number) => any;
	onUpdate?: () => void;
};

const BodyRow = observer(forwardRef<{}, Props>((props, ref) => {

	const {
		rootId, block, style, recordId, readonly, isInline, onRefRecord, getRecord, onContext, onDragRecordStart, getColumnWidths,
		getVisibleRelations, onSelectToggle, onUpdate,
	} = props;
	const relations = getVisibleRelations();
	const widths = getColumnWidths('', 0);
	const record = getRecord(recordId);
	const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');
	const cn = [ 'row', U.Data.layoutClass('', record.layout), ];
	const keys = J.Relation.default.concat(relations.map((relation: any) => relation.relationKey));
	const rowRef = useRef<HTMLDivElement>(null);

	if (U.Object.isTaskLayout(record.layout) && record.done) {
		cn.push('isDone');
	};
	if (record.isArchived) {
		cn.push('isArchived');
	};
	if (record.isDeleted) {
		cn.push('isDeleted');
	};

	const watchedValues = useMemo(() => keys.map(k => record[k]), keys.map(k => record[k]));

	useEffect(() => {
		onUpdate?.();
	}, watchedValues);

	// Watch for cells exiting edit mode and trigger re-measurement
	// This is needed because when a cell exits edit mode, the CSS layout changes
	// but the record values don't change, so the watchedValues effect doesn't fire
	useEffect(() => {
		if (!onUpdate || !rowRef.current) {
			return;
		};

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if ((mutation.type == 'attributes') && (mutation.attributeName === 'class')) {
					const target = mutation.target as HTMLElement;
					const oldValue = mutation.oldValue || '';
					const hadEditing = oldValue.includes('isEditing');
					const hasEditing = target.classList.contains('isEditing');

					// Check if a cell just exited edit mode (had isEditing, now doesn't)
					if (target.classList.contains('cell') && hadEditing && !hasEditing) {
						// Use requestAnimationFrame to ensure DOM has fully updated
						requestAnimationFrame(() => onUpdate());
						break;
					};
				};
			};
		});

		observer.observe(rowRef.current, {
			attributes: true,
			attributeFilter: ['class'],
			attributeOldValue: true,
			subtree: true,
		});

		return () => observer.disconnect();
	}, [ onUpdate ]);

	let content = (
		<>
			{relations.map((relation: any, i: number) => (
				<Cell
					key={[ 'grid', block.id, relation.relationKey, record.id ].join(' ')}
					{...props}
					getRecord={() => record}
					width={relation.width}
					relationKey={relation.relationKey}
					className={`index${i}`}
				/>
			))}
			<div className="cell last" />
		</>
	);

	if (isInline) {
		content = (
			<div style={{ gridTemplateColumns: str, display: 'grid' }}>
				{content}
			</div>
		);
	} else {
		content = (
			<SelectionTarget id={record.id} type={I.SelectType.Record} style={{ gridTemplateColumns: str }}>
				{content}
			</SelectionTarget>
		);
	};

	if (!isInline) {
		content = (
			<>
				{!readonly ? (
					<Icon
						className="drag"
						draggable={true}
						onClick={e => onSelectToggle(e, record.id)}
						onDragStart={e => onDragRecordStart(e, record.id)}
						onMouseEnter={() => keyboard.setSelectionClearDisabled(true)}
						onMouseLeave={() => keyboard.setSelectionClearDisabled(false)}
					/>
				) : ''}

				<DropTarget {...props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
					{content}
				</DropTarget>
			</>
		);
	};

	return (
		<AnimatePresence mode="popLayout">
			<motion.div
				id={`record-${record.id}`}
				ref={el => {
				rowRef.current = el;
				onRefRecord(el, record.id);
			}}
				className={cn.join(' ')}
				style={style}
				onContextMenu={e => onContext(e, record.id)}
				{...U.Common.animationProps({
					transition: { duration: 0.2, delay: 0.1 },
				})}
			>
				{content}
			</motion.div>
		</AnimatePresence>
	);

}));

export default BodyRow;
