import React, { FC, useRef } from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { I, S, J, U, Relation, translate } from 'Lib';
import { Cell, Button } from 'Component';

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

const BodyCell: FC<Props> = observer((props, ref) => {

	const {
		rootId, block, className, relationKey, readonly, recordId, getView, getRecord, onRefCell, onCellClick, onCellChange,
		getIdPrefix, canCellEdit,
	} = props;
	const record = getRecord(recordId);
	const relation: any = S.Record.getRelationByKey(relationKey) || {};
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

	const onEdit = (e: React.MouseEvent) => {
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

	let button = null;
	let onClick = e => onCellClick(e, relationKey, record.id);

	if (isName && !U.Object.isNoteLayout(record.layout) && canEdit) {
		onClick = onEdit;
		button = (
			<Button
				color="blank"
				icon="expand"
				className="expand c32"
				text={translate('commonOpen')}
				onClick={e => onCellClick(e, relationKey, record.id)}
			/>
		);
	};

	return (
		<div
			key={id}
			id={id}
			className={cn.join(' ')}
			onClick={onClick}
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
});

export default BodyCell;