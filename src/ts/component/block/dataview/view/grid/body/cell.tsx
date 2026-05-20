import React, { FC, useRef, MouseEvent } from 'react';
import { Cell, Button, Icon } from 'Component';
import * as I from 'Interface';

interface Props {
	rootId?: string;
	block?: I.Block;
	relationKey: string;
	readonly: boolean;
	width: number;
	className?: string;
	recordId?: string;
	recordIdx?: number;
	getView?(): I.View;
	getRecord?(id: string): any;
	getIdPrefix?(): string;
	onRefCell?(ref: any, id: string): void;
	onCellClick?(e: any, key: string, id?: string): void;
	onCellChange?(id: string, key: string, value: any, callBack?: (message: any) => void): void;
	canCellEdit?(relation: any, recordId: any): boolean;
};

const BodyCell: FC<Props> = (props, ref) => {

	const {
		rootId, block, className, relationKey, readonly, recordId, getView, getRecord, onRefCell, onCellClick, onCellChange,
		getIdPrefix, canCellEdit,
	} = props;
	const record = getRecord(recordId);
	const relation: any = S.Record.getRelationByKey(relationKey);

	if (!relation) {
		return null;
	};

	const view = getView();
	const viewRelation = view?.getRelation(relationKey);
	const cn = [ 'cell', `cell-key-${relationKey}`, Relation.className(relation.format), `align${viewRelation?.align}` ];
	const idPrefix = getIdPrefix();
	const id = Relation.cellId(idPrefix, relationKey, record.id);
	const width = Relation.width(props.width, relation.format);
	const size = J.Size.dataview.cell;
	const subId = S.Record.getSubId(rootId, block.id);
	const canEdit = canCellEdit(relation, record);
	const isName = relationKey == 'name';
	const cellRef = useRef(null);

	const onEdit = (e: MouseEvent) => {
		e.stopPropagation();
		cellRef.current.onClick(e);
	};


	if (isName) {
		cn.push('isName');
	};

	if (!readonly) {
		cn.push('canEdit');
	};

	if (width <= size.small) {
		cn.push('small');
	} else
	if ((width > size.small) && (width <= size.medium)) {
		cn.push('medium');
	};

	if (className) {
		cn.push(className);
	};

	const isOverNameText = (e: MouseEvent): boolean => {
		const nameEl = (e.target as HTMLElement).closest('.name') as HTMLElement;
		if (!nameEl) {
			return false;
		};

		const range = document.createRange();
		range.selectNodeContents(nameEl);

		const rect = range.getBoundingClientRect();
		const padding = 4;
		return (e.clientX >= rect.left - padding) && (e.clientX <= rect.right + padding) && (e.clientY >= rect.top - padding) && (e.clientY <= rect.bottom + padding);
	};

	const isSplitMode = isName && !U.Object.isNoteLayout(record.layout) && canEdit && S.Common.gridTitleClick;

	let button = null;
	let onClick = e => {
		e.stopPropagation();
		onCellClick(e, relationKey, record.id);
	};
	let onMouseMove = null;
	let onMouseLeave = null;

	if (isName && !U.Object.isNoteLayout(record.layout) && canEdit) {
		if (S.Common.gridTitleClick) {
			onClick = e => {
				e.stopPropagation();

				if (isOverNameText(e)) {
					onEdit(e);
				} else {
					onCellClick(e, relationKey, record.id);
				};
			};
			button = (
				<Button
					color="blank"
					iconParam={{ name: 'common/expand' }}
					className="expand"
					size={32}
					text={translate('commonOpen')}
					onClick={e => {
						e.stopPropagation();
						onCellClick(e, relationKey, record.id);
					}}
				/>
			);
		} else {
			button = (
				<Icon
					name="common/edit"
					className="edit"
					onClick={onEdit}
				/>
			);
		};
	};

	if (isSplitMode) {
		onMouseMove = (e: MouseEvent) => {
			const btn = U.Dom.select('.button.expand', e.currentTarget as HTMLElement);
			if (btn) {
				U.Dom.toggleClass(btn, 'hover', !isOverNameText(e));
			};
		};
		onMouseLeave = (e: MouseEvent) => {
			const btn = U.Dom.select('.button.expand', e.currentTarget as HTMLElement);
			if (btn) {
				U.Dom.removeClass(btn, 'hover');
			};
		};
	};

	return (
		<div
			key={id}
			id={id}
			className={cn.join(' ')}
			onClick={onClick}
			onMouseMove={onMouseMove}
			onMouseLeave={onMouseLeave}
		>
			<Cell
				ref={ref => {
					cellRef.current = ref;
					onRefCell(ref, id);
				}}
				{...props}
				getRecord={() => record}
				subId={subId}
				relationKey={relationKey}
				viewType={I.ViewType.Grid}
				idPrefix={idPrefix}
				onCellChange={onCellChange}
				maxWidth={J.Size.dataview.cell.edit}
				menuParam={{ noBorderY: true }}
			/>
			{button}
		</div>
	);
};

export default BodyCell;