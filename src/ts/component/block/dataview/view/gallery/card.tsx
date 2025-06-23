import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Cell, DropTarget, SelectionTarget, ObjectCover } from 'Component';
import { I, S, U, Relation, keyboard } from 'Lib';

interface Props extends I.ViewComponent {
	style?: any;
};

const Card = observer(class Card extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
	};

	render () {
		const { rootId, block, recordId, getRecord, getView, onRef, style, onContext, getIdPrefix, getVisibleRelations, isInline, isCollection, getCoverObject } = this.props;
		const record = getRecord(recordId);
		const view = getView();
		const { cardSize, coverFit, hideIcon } = view;
		const relations = getVisibleRelations();
		const idPrefix = getIdPrefix();
		const cn = [ 'card', U.Data.layoutClass(record.id, record.layout), U.Data.cardSizeClass(cardSize) ];
		const subId = S.Record.getSubId(rootId, block.id);
		const cover = getCoverObject(recordId);

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
					{relations.map((vr: any) => {
						const relation = S.Record.getRelationByKey(vr.relationKey);
						const id = Relation.cellId(idPrefix, relation.relationKey, record.id);

						return (
							<Cell
								elementId={id}
								key={'list-cell-' + view.id + relation.relationKey}
								{...this.props}
								getRecord={() => record}
								subId={subId}
								ref={ref => onRef(ref, id)}
								relationKey={relation.relationKey}
								viewType={view.type}
								idPrefix={idPrefix}
								arrayLimit={2}
								tooltipParam={{ text: relation.name, typeX: I.MenuDirection.Left }}
								onClick={e => this.onCellClick(e, relation)}
								iconSize={relation.relationKey == 'name' ? 20 : 18}
								shortUrl={true}
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

			if (isCollection) {
				content = (
					<DropTarget {...this.props} rootId={rootId} id={record.id} dropType={I.DropType.Record}>
						{content}
					</DropTarget>
				);
			};
		};

		return (
			<div
				id={`record-${record.id}`}
				ref={node => this.node = node}
				className={cn.join(' ')} 
				style={style}
				draggable={isCollection && !isInline}
				onClick={this.onClick}
				onContextMenu={(e: any) => onContext(e, record.id)}
				onDragStart={this.onDragStart}
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
		const last = node.find('.cellContent:not(.isEmpty)').last();

		node.find('.cellContent').removeClass('last');
		if (last.length) {
			last.addClass('last');
		};
	};

	onDragStart (e: any) {
		const { isCollection, recordId, getRecord, onDragRecordStart } = this.props;
		const record = getRecord(recordId);

		if (isCollection) {
			onDragRecordStart(e, record.id);
		};
	};

	onClick (e: any) {
		e.preventDefault();

		const { recordId, getRecord, onContext } = this.props;
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

});

export default Card;
