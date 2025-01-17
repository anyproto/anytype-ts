import * as React from 'react';
import { observer } from 'mobx-react';
import { I, S, J, U, Relation } from 'Lib';
import { Cell, Icon } from 'Component';

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
	onRef?(ref: any, id: string): void;
	onCellClick?(e: any, key: string, id?: string): void;
	onCellChange?(id: string, key: string, value: any, callBack?: (message: any) => void): void;
	canCellEdit?(relation: any, recordId: any): boolean;
};

const BodyCell = observer(class BodyCell extends React.Component<Props> {

	ref = null;

	constructor (props: Props) {
		super(props);

		this.onEdit = this.onEdit.bind(this);
	};

	render () {
		const { 
			rootId, block, className, relationKey, readonly, recordId, getView, getRecord, onRef, onCellClick, onCellChange, 
			getIdPrefix, canCellEdit,
		} = this.props;
		const record = getRecord(recordId);
		const relation: any = S.Record.getRelationByKey(relationKey) || {};
		const view = getView();
		const viewRelation = view?.getRelation(relationKey);
		const cn = [ 'cell', `cell-key-${relationKey}`, Relation.className(relation.format), `align${viewRelation?.align}` ];
		const idPrefix = getIdPrefix();
		const id = Relation.cellId(idPrefix, relationKey, record.id);
		const width = Relation.width(this.props.width, relation.format);
		const size = J.Size.dataview.cell;
		const subId = S.Record.getSubId(rootId, block.id);
		const canEdit = canCellEdit(relation, record);
		const isName = relationKey == 'name';

		if (isName) {
			cn.push('isName');
		};

		if (!readonly) {
			cn.push('canEdit');
		};

		if (width <= size.icon) {
			cn.push('small');
		};

		if (className) {
			cn.push(className);
		};

		let iconEdit = null;
		if (isName && !U.Object.isNoteLayout(record.layout) && canEdit) {
			iconEdit = <Icon className="edit" onClick={this.onEdit} />;
		};

		return (
			<div 
				key={id} 
				id={id} 
				className={cn.join(' ')} 
				onClick={e => onCellClick(e, relationKey, record.id)} 
			>
				<Cell 
					ref={ref => { 
						this.ref = ref;
						onRef(ref, id); 
					}} 
					{...this.props}
					getRecord={() => record}
					subId={subId}
					relationKey={relationKey}
					viewType={I.ViewType.Grid}
					idPrefix={idPrefix}
					onCellChange={onCellChange}
					maxWidth={J.Size.dataview.cell.edit}
				/>
				{iconEdit}
			</div>
		);
	};

	onEdit (e: React.MouseEvent) {
		e.stopPropagation();
		this.ref.onClick(e);
	};

});

export default BodyCell;
