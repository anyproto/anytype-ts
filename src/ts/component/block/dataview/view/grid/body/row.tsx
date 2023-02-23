import * as React from 'react';
import {DataUtil, I, keyboard, Util} from 'Lib';
import { observer } from 'mobx-react';
import { dbStore } from 'Store';
import { DropTarget, Icon } from 'Component';
import Cell from './cell';
import $ from 'jquery';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
	cellPosition?: (cellId: string) => void;
	onRef?(ref: any, id: string): void;
	getColumnWidths?: (relationId: string, width: number) => any;
};

const BodyRow = observer(class BodyRow extends React.Component<Props> {

	node: any = null;

	constructor (props: Props) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
	};

	render () {
		const { rootId, index, getRecord, style, onContext, getColumnWidths, isInline, getVisibleRelations, isCollection } = this.props;
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

		if (isCollection) {
			content = (
				<React.Fragment>
					<Icon className="dnd" draggable={true} onDragStart={this.onDragStart} />
					<DropTarget {...this.props} rootId={rootId} id={record.id} dropType={I.DropType.Record} canDropMiddle={true}>
						{content}
					</DropTarget>
				</React.Fragment>
			);
		};

		return (
			<div
				ref={node => this.node = node}
				id={'row-' + index}
				className={cn.join(' ')}
				style={style}
				onContextMenu={(e: any) => { onContext(e, record.id); }}
			>
				{content}
			</div>
		);
	};

	onDragStart (e: any) {
		e.stopPropagation();

		const { dataset, block, index, getRecord } = this.props;
		const { selection, onDragStart } = dataset || {};
		const record = getRecord(index);
		const target = $(this.node);
		const clone = target.clone();

		let ids = selection.get(I.SelectType.Record);
		if (!ids.length) {
			ids = [ record.id ];
		};

		if (!selection || !onDragStart) {
			return;
		};

		if (!block.isDraggable()) {
			e.preventDefault();
			return;
		};

		keyboard.disableSelection(true);

		onDragStart(e, I.DropType.Record, ids, this);
	};

});

export default BodyRow;