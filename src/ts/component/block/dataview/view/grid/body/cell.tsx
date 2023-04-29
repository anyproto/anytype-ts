import * as React from 'react';
import { observer } from 'mobx-react';
import { I, Relation } from 'Lib';
import { Cell, Icon } from 'Component';
import { dbStore } from 'Store';
import Constant from 'json/constant.json';

interface Props {
	rootId?: string;
	block?: I.Block;
	recordId: string;
	relationKey: string;
	readonly: boolean;
	width: number;
	className?: string;
	getRecord(id?: string): any;
	getIdPrefix?(): string;
	onRef?(ref: any, id: string): void;
	onCellClick?(e: any, key: string, id?: string): void;
	onCellChange?(id: string, key: string, value: any, callBack?: (message: any) => void): void;
};

const BodyCell = observer(class BodyCell extends React.Component<Props> {

	ref = null;

	constructor (props: Props) {
		super(props);

		this.onEdit = this.onEdit.bind(this);
	};

	render () {
		const { rootId, block, className, relationKey, recordId, readonly, onRef, getRecord, onCellClick, onCellChange, getIdPrefix } = this.props;
		const relation: any = dbStore.getRelationByKey(relationKey) || {};
		const cn = [ 'cell', `cell-key-${this.props.relationKey}`, Relation.className(relation.format), (!readonly ? 'canEdit' : '') ];
		const idPrefix = getIdPrefix();
		const id = Relation.cellId(idPrefix, relation.relationKey, recordId);
		const width = Relation.width(this.props.width, relation.format);
		const size = Constant.size.dataview.cell;
		const subId = dbStore.getSubId(rootId, block.id);
		const record = getRecord(recordId);

		if (relation.relationKey == 'name') {
			cn.push('isName');
		};

		if (width <= size.icon) {
			cn.push('small');
		};

		if (className) {
			cn.push(className);
		};

		let iconEdit = null;
		if ((relation.relationKey == 'name') && (record.layout != I.ObjectLayout.Note)) {
			iconEdit = <Icon className="edit" onClick={this.onEdit} />;
		};

		return (
			<div 
				key={id} 
				id={id} 
				className={cn.join(' ')} 
				onClick={(e: any) => { onCellClick(e, relation.relationKey, recordId); }} 
			>
				<Cell 
					ref={ref => { 
						this.ref = ref;
						onRef(ref, id); 
					}} 
					{...this.props}
					subId={subId}
					relationKey={relation.relationKey}
					viewType={I.ViewType.Grid}
					idPrefix={idPrefix}
					onCellChange={onCellChange}
					maxWidth={Constant.size.dataview.cell.edit}
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