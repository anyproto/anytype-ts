import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, U, keyboard, Relation } from 'Lib';
import { Cell, DropTarget, Icon, SelectionTarget } from 'Component';

interface Props extends I.ViewComponent {
	style?: any;
};

const Row = observer(class Row extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	render () {
		const { rootId, block, recordId, getRecord, getView, onRef, style, onContext, getIdPrefix, isInline, isCollection, onDragRecordStart, onSelectToggle } = this.props;
		const view = getView();
		const relations = view.getVisibleRelations();
		const idPrefix = getIdPrefix();
		const subId = S.Record.getSubId(rootId, block.id);
		const record = getRecord(recordId);
		const cn = [ 'row' ];

		// Subscriptions
		const { hideIcon } = view;
		const { done } = record;

		if (U.Object.isTaskLayout(record.layout) && done) {
			cn.push('isDone');
		};

		let content = (
			<>
				{relations.map((vr: any, i: number) => {
					const relation = S.Record.getRelationByKey(vr.relationKey);
					const id = Relation.cellId(idPrefix, relation.relationKey, record.id);

					return (
						<Cell
							key={'list-cell-' + relation.relationKey}
							elementId={id}
							ref={ref => onRef(ref, id)}
							{...this.props}
							getRecord={() => record}
							subId={subId}
							relationKey={relation.relationKey}
							viewType={I.ViewType.List}
							idPrefix={idPrefix}
							onClick={e => this.onCellClick(e, relation)}
							isInline={true}
							tooltipParam={{ text: relation.name, typeX: I.MenuDirection.Left, offsetX: 14 }}
							arrayLimit={2}
							iconSize={relation.relationKey == 'name' ? 24 : 18}
							withName={true}
						/>
					);
				})}
			</>
		);

		if (!isInline) {
			content = (
				<SelectionTarget id={record.id} type={I.SelectType.Record}>
					{content}
				</SelectionTarget>
			);
		};

		if (isCollection && !isInline) {
			content = (
				<>
					<Icon
						className="drag"
						draggable={true}
						onClick={e => onSelectToggle(e, record.id)}
						onDragStart={e => onDragRecordStart(e, record.id)}
						onMouseEnter={() => keyboard.setSelectionClearDisabled(true)}
						onMouseLeave={() => keyboard.setSelectionClearDisabled(false)}
					/>
					<DropTarget {...this.props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
						{content}
					</DropTarget>
				</>
			);
		};

		return (
			<div 
				id={`record-${record.id}`}
				ref={node => this.node = node} 
				className={cn.join(' ')} 
				style={style}
				onClick={e => this.onClick(e)}
				onContextMenu={e => onContext(e, record.id)}
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

		const { onContext, recordId, getRecord } = this.props;
		const record = getRecord(recordId);
		const selection = S.Common.getRef('selectionProvider');
		const cb = {
			0: () => {
				keyboard.withCommand(e) ? U.Object.openEvent(e, record) : U.Object.openConfig(record); 
			},
			2: () => onContext(e, record.id)
		};

		const ids = selection?.get(I.SelectType.Record) || [];
		if ((keyboard.withCommand(e) && ids.length) || keyboard.isSelectionClearDisabled) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	onCellClick (e: React.MouseEvent, vr: I.ViewRelation) {
		const { onCellClick, recordId, getRecord } = this.props;
		const record = getRecord(recordId);
		const relation = S.Record.getRelationByKey(vr.relationKey);

		if (!relation || ![ I.RelationType.Url, I.RelationType.Phone, I.RelationType.Email, I.RelationType.Checkbox ].includes(relation.format)) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		onCellClick(e, relation.relationKey, record.id);
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
