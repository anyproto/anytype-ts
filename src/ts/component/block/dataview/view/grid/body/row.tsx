import * as React from 'react';
import {DataUtil, I, keyboard, Util} from 'Lib';
import { observer } from 'mobx-react';
import { dbStore } from 'Store';
import { DropTarget, Icon } from 'Component';
import Cell from './cell';
import $ from 'jquery';
import arrayMove from "array-move";

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
	cellPosition?: (cellId: string) => void;
	onRef?(ref: any, id: string): void;
	getColumnWidths?: (relationId: string, width: number) => any;
};

const BodyRow = observer(class BodyRow extends React.Component<Props> {

	render () {
		const { rootId, index, block, getRecord, style, onContext, onDragRecordStart, getColumnWidths, isInline, getVisibleRelations, isCollection, onMultiSelect } = this.props;
		const relations = getVisibleRelations();
		const record = getRecord(index);
		const widths = getColumnWidths('', 0);
		const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');
		const cn = [ 'row' ];

		if ((record.layout == I.ObjectLayout.Task) && record.done) {
			cn.push('isDone');
		};
		if (record.isArchived) {
			cn.push('isArchived');
		};
		if (record.isDeleted) {
			cn.push('isDeleted');
		};

		let content = (
			<React.Fragment>
				{relations.map((relation: any, i: number) => (
					<Cell
						key={[ 'grid', block.id, relation.relationKey, record.id ].join(' ')}
						{...this.props}
						width={relation.width}
						index={index}
						relationKey={relation.relationKey}
						className={`index${i}`}
					/>
				))}
				<div className="cell last" />
			</React.Fragment>
		);

		if (isInline) {
			content = (
				<div style={{ gridTemplateColumns: str, display: 'grid' }}>
					{content}
				</div>
			);
		} else {
			content = (
				<div
					id={'selectable-' + record.id}
					className={[ 'selectable', 'type-' + I.SelectType.Record ].join(' ')}
					{...Util.dataProps({ id: record.id, type: I.SelectType.Record })}
					style={{ gridTemplateColumns: str }}
				>
					{content}
				</div>
			);
		};

		if (isCollection && !isInline) {
			content = (
				<React.Fragment>
					<Icon
						className="dnd"
						draggable={true}
						onClick={() => { onMultiSelect(record.id); }}
						onDragStart={(e: any) => { onDragRecordStart(e, index); }}
						onMouseEnter={() => { keyboard.setSelectionClearDisabled(true); }}
						onMouseLeave={() => { keyboard.setSelectionClearDisabled(false); }}
					/>
					<DropTarget {...this.props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
						{content}
					</DropTarget>
				</React.Fragment>
			);
		};

		return (
			<div
				id={'row-' + index}
				className={cn.join(' ')}
				style={style}
				onContextMenu={(e: any) => { onContext(e, record.id); }}
			>
				{content}
			</div>
		);
	};

});

export default BodyRow;