import * as React from 'react';
import { I } from 'Lib';
import { observer } from 'mobx-react';
import { dbStore } from 'Store';

import Cell from './cell';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
	cellPosition?: (cellId: string) => void;
	onRef?(ref: any, id: string): void;
	getColumnWidths?: (relationId: string, width: number) => any;
};

const BodyRow = observer(class BodyRow extends React.Component<Props, {}> {

	render () {
		const { rootId, block, index, getView, getRecord, style, onContext, getColumnWidths, isInline } = this.props;
		const view = getView();
		const relations = view.getVisibleRelations();
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

		const Cells = () => (
			<div style={{ gridTemplateColumns: str, display: 'grid' }}>
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
			</div>
		);

		const Selectable = () => (
			<div
				id={'selectable-' + record.id}
				className={[ 'selectable', 'type-' + I.SelectType.Record ].join(' ')}
				data-id={record.id}
				data-type={I.SelectType.Record}
				style={{ gridTemplateColumns: str }}
			>
				<Cells />
			</div>
		);

		return (
			<div 
				id={'row-' + index} 
				className={cn.join(' ')} 
				style={style} 
				onContextMenu={(e: any) => { onContext(e, record.id); }}
			>
				{isInline ? <Cells /> : <Selectable />}
			</div>
		);
	};

});

export default BodyRow;