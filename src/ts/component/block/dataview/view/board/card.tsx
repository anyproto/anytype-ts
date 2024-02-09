import * as React from 'react';
import { I, UtilCommon, UtilData, UtilObject, Relation, keyboard } from 'Lib';
import { dbStore, detailStore } from 'Store';
import { observer } from 'mobx-react';
import { Cell } from 'Component';

interface Props extends I.ViewComponent {
	id: string;
	groupId: string;
	onDragStartCard?: (e: any, groupId: any, record: any) => void;
};

const Card = observer(class Card extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	render () {
		const { rootId, block, groupId, id, getView, onContext, onRef, onDragStartCard, getIdPrefix, isInline, getVisibleRelations } = this.props;
		const view = getView();
		const relations = getVisibleRelations();
		const idPrefix = getIdPrefix();
		const subId = dbStore.getGroupSubId(rootId, block.id, groupId);
		const record = detailStore.get(subId, id);
		const cn = [ 'card', UtilData.layoutClass(record.id, record.layout) ];
		const { done } = record;

		let content = (
			<div className="cardContent">
				{relations.map((relation: any, i: number) => {
					const id = Relation.cellId(idPrefix, relation.relationKey, record.id);
					return (
						<Cell
							elementId={id}
							key={'board-cell-' + view.id + relation.relationKey}
							{...this.props}
							record={record}
							subId={subId}
							ref={ref => onRef(ref, Relation.cellId(idPrefix, relation.relationKey, record.id))}
							relationKey={relation.relationKey}
							viewType={view.type}
							idPrefix={idPrefix}
							arrayLimit={2}
							showTooltip={true}
							tooltipX={I.MenuDirection.Left}
							onClick={e => this.onCellClick(e, relation)}
							iconSize={relation.relationKey == 'name' ? 20 : 18}
							withName={true}
						/>
					);
				})}
			</div>
		);

		if (!isInline) {
			content = (
				<div
					id={'selectable-' + record.id}
					className={[ 'selectable', 'type-' + I.SelectType.Record ].join(' ')}
					{...UtilCommon.dataProps({ id: record.id, type: I.SelectType.Record })}
				>
					{content}
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node} 
				id={`record-${record.id}`}
				className={cn.join(' ')} 
				draggable={true}
				onDragStart={e => onDragStartCard(e, groupId, record)}
				onClick={e => this.onClick(e)}
				onContextMenu={e => onContext(e, record.id)}
				{...UtilCommon.dataProps({ id: record.id })}
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

		const { rootId, block, groupId, id, onContext, dataset } = this.props;
		const { selection } = dataset || {};
		const subId = dbStore.getGroupSubId(rootId, block.id, groupId);
		const record = detailStore.get(subId, id);
		const cb = {
			0: () => {
				keyboard.withCommand(e) ? UtilObject.openWindow(record) : UtilObject.openPopup(record); 
			},
			2: () => onContext(e, record.id)
		};

		const ids = selection ? selection.get(I.SelectType.Record) : [];
		if ((keyboard.withCommand(e) && ids.length) || keyboard.isSelectionClearDisabled) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	onCellClick (e: React.MouseEvent, vr: I.ViewRelation) {
		const { onCellClick, record } = this.props;
		const relation = dbStore.getRelationByKey(vr.relationKey);

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
		const last = node.find('.cellContent:not(.isEmpty)').last();

		node.find('.cellContent').removeClass('last');
		if (last.length) {
			last.addClass('last');
		};
	};

});

export default Card;