import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { I, Relation, Util } from 'Lib';
import { Cell, DropTarget } from 'Component';
import { dbStore } from 'Store';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
};

const Row = observer(class Row extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	render () {
		const { rootId, block, index, getView, onCellClick, onRef, style, getRecord, onContext, getIdPrefix, isInline, isCollection } = this.props;
		const view = getView();
		const relations = view.getVisibleRelations();
		const idPrefix = getIdPrefix();
		const { hideIcon } = view;
		const subId = dbStore.getSubId(rootId, block.id);
		const record = getRecord(index);

		let content = (
			<React.Fragment>
				{relations.map((relation: any, i: number) => {
					const id = Relation.cellId(idPrefix, relation.relationKey, index);
					return (
						<Cell
							key={'list-cell-' + relation.relationKey}
							elementId={id}
							ref={(ref: any) => { onRef(ref, id); }}
							{...this.props}
							subId={subId}
							relationKey={relation.relationKey}
							viewType={I.ViewType.List}
							idPrefix={idPrefix}
							onClick={(e: any) => { onCellClick(e, relation.relationKey, index); }}
							index={index}
							isInline={true}
							showTooltip={true}
							arrayLimit={2}
							iconSize={24}
						/>
					);
				})}
			</React.Fragment>
		);

		if (!isInline) {
			content = (
				<div
					id={'selectable-' + record.id}
					className={[ 'selectable', 'type-' + I.SelectType.Record ].join(' ')}
					{...Util.dataProps({ id: record.id, type: I.SelectType.Record })}
				>
					{content}
				</div>
			)
		};

		if (isCollection) {
			content = (
				<DropTarget {...this.props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
					{content}
				</DropTarget>
			);
		};

		return (
			<div 
				ref={node => this.node = node} 
				className="row" 
				style={style}
				onContextMenu={(e: any) => { onContext(e, record.id); }}
			>
				{content}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const first = node.find('.cellContent:not(.isEmpty)').first();

		node.find('.cellContent').removeClass('first');
		if (first.length) {
			first.addClass('first');
		};
	};

});

export default Row;