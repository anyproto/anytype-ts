import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, DataUtil, Relation, keyboard } from 'ts/lib';
import { dbStore, detailStore } from 'ts/store';
import { observer } from 'mobx-react';

import Cell from 'ts/component/block/dataview/cell';

interface Props extends I.ViewComponent {
	id: string;
	groupId: string;
	index: number;
	onDragStartCard?: (e: any, groupId: any, record: any) => void;
};

const Card = observer(class Card extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	render () {
		const { rootId, block, groupId, id, index, getView, onContext, onRef, onDragStartCard } = this.props;
		const view = getView();
		const relations = view.relations.filter((it: any) => { return it.isVisible; });
		const idPrefix = 'dataviewCell';
		const subId = dbStore.getSubId(rootId, [ block.id, groupId ].join(':'));
		const record = detailStore.get(subId, id);
		const cn = [ 'card', DataUtil.layoutClass(record.id, record.layout) ];

		return (
			<div 
				id={`card-${record.id}`}
				className={cn.join(' ')} 
				data-id={record.id}
				draggable={true}
				onDragStart={(e: any) => { onDragStartCard(e, groupId, record); }}
				onClick={(e: any) => { this.onClick(e); }}
				onContextMenu={(e: any) => { onContext(e, record.id); }}
			>
				<div className="cardContent">
					{relations.map((relation: any, i: number) => {
						const id = Relation.cellId(idPrefix, relation.relationKey, 0);
						return (
							<Cell 
								key={'board-cell-' + view.id + relation.relationKey} 
								{...this.props}
								getRecord={() => { return record; }}
								subId={subId}
								ref={(ref: any) => { onRef(ref, id); }} 
								relationKey={relation.relationKey}
								index={0}
								viewType={view.type}
								idPrefix={idPrefix}
								arrayLimit={2}
								showTooltip={true}
								tooltipX={I.MenuDirection.Left}
							/>
						);
					})}
				</div>
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

		if (keyboard.isSpecial(e)) {
			return;
		};

		const { rootId, block, groupId, id, onContext } = this.props;
		const subId = dbStore.getSubId(rootId, [ block.id, groupId ].join(':'));
		const record = detailStore.get(subId, id);
		const cb = {
			0: () => { DataUtil.objectOpenPopup(record); },
			2: () => { onContext(e, record.id); }
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const last = node.find('.cellContent:not(.isEmpty)').last();

		node.find('.cellContent').removeClass('last');
		if (last.length) {
			last.addClass('last');
		};
	};

});

export default Card;