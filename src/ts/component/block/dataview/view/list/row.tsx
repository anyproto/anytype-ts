import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, keyboard, Relation, Util, ObjectUtil } from 'Lib';
import { Cell, DropTarget, Icon } from 'Component';
import { dbStore } from 'Store';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
};

const Row = observer(class Row extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	render () {
		const { rootId, block, index, getView, onRef, style, getRecord, onContext, getIdPrefix, isInline, isCollection, onDragRecordStart, onMultiSelect } = this.props;
		const view = getView();
		const relations = view.getVisibleRelations();
		const idPrefix = getIdPrefix();
		const subId = dbStore.getSubId(rootId, block.id);
		const record = getRecord(index);

		// Subscriptions
		const { hideIcon } = view;
		const { done } = record;

		let content = (
			<React.Fragment>
				{relations.map((relation: any, i: number) => {
					const id = Relation.cellId(idPrefix, relation.relationKey, index);
					return (
						<Cell
							key={'list-cell-' + relation.relationKey}
							elementId={id}
							ref={ref => { onRef(ref, id); }}
							{...this.props}
							subId={subId}
							relationKey={relation.relationKey}
							viewType={I.ViewType.List}
							idPrefix={idPrefix}
							onClick={(e: any) => { this.onCellClick(e, relation); }}
							index={index}
							isInline={true}
							showTooltip={true}
							arrayLimit={2}
							iconSize={relation.relationKey == 'name' ? 24 : 20}
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
				<React.Fragment>
					<Icon
						className="dnd"
						draggable={true}
						onClick={(e: any) => { onMultiSelect(record.id); }}
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
				ref={node => this.node = node} 
				className="row" 
				style={style}
				onClick={(e: any) => { this.onClick(e); }}
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

	onClick (e: any) {
		e.preventDefault();

		const { onContext, dataset, getRecord, index } = this.props;
		const { selection } = dataset || {};
		const record = getRecord(index);
		const cb = {
			0: () => {
				keyboard.withCommand(e) ? ObjectUtil.openWindow(record) : ObjectUtil.openPopup(record); 
			},
			2: () => { onContext(e, record.id); }
		};

		const ids = selection ? selection.get(I.SelectType.Record) : [];
		if ((keyboard.withCommand(e) && ids.length) || keyboard.isSelectionClearDisabled) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	onCellClick (e: React.MouseEvent, relation) {
		const { onCellClick, index } = this.props;

		if (![ I.RelationType.Url, I.RelationType.Phone, I.RelationType.Email, I.RelationType.Checkbox ].includes(relation.format)) {
			return;
		};

		onCellClick(e, relation.relationKey, index);
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