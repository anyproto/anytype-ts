import * as React from 'react';
import { observer } from 'mobx-react';
import { I, S, U, Relation, keyboard } from 'Lib';
import { Cell, SelectionTarget, ObjectCover } from 'Component';

interface Props extends I.ViewComponent {
	id: string;
	groupId: string;
	onDragStartCard?: (e: any, groupId: any, record: any) => void;
};

const Card = observer(class Card extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	render () {
		const { rootId, block, groupId, id, getView, onContext, onRef, onDragStartCard, getIdPrefix, isInline, getVisibleRelations, getCoverObject } = this.props;
		const view = getView();
		const { coverFit, hideIcon } = view;
		const relations = getVisibleRelations();
		const idPrefix = getIdPrefix();
		const subId = S.Record.getGroupSubId(rootId, block.id, groupId);
		const record = S.Detail.get(subId, id, relations.map(it => it.relationKey));
		const cn = [ 'card', U.Data.layoutClass(record.id, record.layout) ];
		const { done } = record;
		const cover = getCoverObject(id);

		if (coverFit) {
			cn.push('coverFit');
		};

		if (cover) {
			cn.push('withCover');
		};

		let content = (
			<div className="cardContent">
				<ObjectCover object={cover} />

				<div className="inner">
					{relations.map((relation: any, i: number) => {
						const id = Relation.cellId(idPrefix, relation.relationKey, record.id);

						return (
							<Cell
								elementId={id}
								key={'board-cell-' + view.id + relation.relationKey}
								{...this.props}
								getRecord={() => record}
								recordId={record.id}
								groupId={groupId}
								subId={subId}
								ref={ref => onRef(ref, Relation.cellId(idPrefix, relation.relationKey, record.id))}
								relationKey={relation.relationKey}
								viewType={view.type}
								idPrefix={idPrefix}
								arrayLimit={2}
								tooltipParam={{ text: relation.name, typeX: I.MenuDirection.Left }}
								onClick={e => this.onCellClick(e, relation)}
								iconSize={relation.relationKey == 'name' ? 20 : 18}
								withName={true}
							/>
						);
					})}
				</div>
			</div>
		);

		if (!isInline) {
			content = (
				<SelectionTarget id={record.id} type={I.SelectType.Record}>
					{content}
				</SelectionTarget>
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
				onContextMenu={e => onContext(e, record.id, subId)}
				{...U.Common.dataProps({ id: record.id })}
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

		const { rootId, block, groupId, id, onContext } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const subId = S.Record.getGroupSubId(rootId, block.id, groupId);
		const record = S.Detail.get(subId, id);
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
		const { id, rootId, block, groupId, onCellClick } = this.props;
		const subId = S.Record.getGroupSubId(rootId, block.id, groupId);
		const record = S.Detail.get(subId, id);
		const relation = S.Record.getRelationByKey(vr.relationKey);

		if (!relation || ![ I.RelationType.Url, I.RelationType.Phone, I.RelationType.Email, I.RelationType.Checkbox ].includes(relation.format)) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		onCellClick(e, relation.relationKey, record.id, record);
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
