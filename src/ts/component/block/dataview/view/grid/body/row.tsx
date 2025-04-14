import * as React from 'react';
import { I, U, keyboard } from 'Lib';
import { observer } from 'mobx-react';
import { DropTarget, Icon, SelectionTarget } from 'Component';
import Cell from './cell';

interface Props extends I.ViewComponent {
	style?: any;
	cellPosition?: (cellId: string) => void;
	onRef?(ref: any, id: string): void;
	getColumnWidths?: (relationId: string, width: number) => any;
};

const BodyRow = observer(class BodyRow extends React.Component<Props> {

	render () {
		const { rootId, block, style, recordId, readonly, getRecord, onContext, onDragRecordStart, getColumnWidths, isInline, getVisibleRelations, isCollection, onSelectToggle } = this.props;
		const relations = getVisibleRelations();
		const widths = getColumnWidths('', 0);
		const record = getRecord(recordId);
		const str = relations.map(it => widths[it.relationKey] + 'px').concat([ 'auto' ]).join(' ');
		const cn = [ 'row', U.Data.layoutClass('', record.layout), ];

		if (U.Object.isTaskLayout(record.layout) && record.done) {
			cn.push('isDone');
		};
		if (record.isArchived) {
			cn.push('isArchived');
		};
		if (record.isDeleted) {
			cn.push('isDeleted');
		};

		let content = (
			<>
				{relations.map((relation: any, i: number) => (
					<Cell
						key={[ 'grid', block.id, relation.relationKey, record.id ].join(' ')}
						{...this.props}
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

		if (isCollection && !isInline) {
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
					<DropTarget {...this.props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
						{content}
					</DropTarget>
				</>
			);
		};

		return (
			<div
				id={`record-${record.id}`}
				className={cn.join(' ')}
				style={style}
				onContextMenu={e => onContext(e, record.id)}
			>
				{content}
			</div>
		);
	};

});

export default BodyRow;
