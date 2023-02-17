import * as React from 'react';
import { I, Util } from 'Lib';
import { observer } from 'mobx-react';
import Cell from './cell';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
	cellPosition?: (cellId: string) => void;
	onRef?(ref: any, id: string): void;
	getColumnWidths?: (relationId: string, width: number) => any;
};

const BodyRow = observer(class BodyRow extends React.Component<Props> {

	render () {
		const { index, getRecord, style, onContext, getColumnWidths, isInline, getVisibleRelations } = this.props;
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
						key={'grid-cell-' + relation.relationKey + record.id}
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