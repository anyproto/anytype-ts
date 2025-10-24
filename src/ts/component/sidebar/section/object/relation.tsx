import React, { forwardRef, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { Cell, Icon } from 'Component';
import { I, S, U, C, Relation, analytics } from 'Lib';

const PREFIX = 'sidebarObjectRelation';

const SidebarSectionObjectRelation = observer(forwardRef<I.SidebarSectionRef, I.SidebarSectionComponent>((props, ref) => {
	
	const { rootId, isPopup, item: relation } = props;
	const nodeRef = useRef(null);
	const cellRef = useRef(null);

	useEffect(() => {
		init();
	});

	const init = () => {
		const node = $(nodeRef.current);
		const cell = node.find('.cell');
		const canEdit = cellRef.current?.canEdit();	

		node.toggleClass('canEdit', canEdit);
		cell.toggleClass('canEdit', canEdit);
	};

	const onCellClick = (e: any) => {
		cellRef.current?.onClick(e);
	};

	const onCellChange = (id: string, relationKey: string, value: any, callBack?: (message: any) => void) => {
		const object = S.Detail.get(rootId, rootId);
		const relation = S.Record.getRelationByKey(relationKey);
		const val = Relation.formatValue(relation, value, true);

		C.ObjectListSetDetails([ object.id ], [ { key: relationKey, value: val } ], callBack);

		if ((undefined !== object[relationKey]) && !U.Common.compareJSON(object[relationKey], value)) {
			analytics.changeRelationValue(relation, value, { type: 'menu', id: 'Single' });
		};
	};

	if (!relation) {
		return null;
	};

	const root = S.Block.getLeaf(rootId, rootId);
	const object = S.Detail.get(rootId, rootId, [ relation.relationKey ]);
	const id = Relation.cellId(PREFIX, relation.relationKey, rootId);
	const rc = Relation.className(relation.format);
	const cw = [ 'wrap', rc ];
	const cn = [ 'cell', rc ];
	const readonly = props.readonly || root?.isLocked();
	const canEdit = !readonly && S.Block.checkFlags(rootId, rootId, [ I.RestrictionObject.Details ]);
	const hasMore = canEdit && relation.onMore;
	const container = [ 
		U.Common.getCellContainer(isPopup ? 'popup' : 'page'),
		U.Common.getCellContainer('sidebarRight'),
	].join(', ');

	if (hasMore) {
		cw.push('hasMore');
	};

	return (
		<div ref={nodeRef} className={cw.join(' ')}>
			<div className="name">{relation.name}</div>

			<div 
				id={id} 
				className={cn.join(' ')} 
				onClick={onCellClick}
			>
				<Cell 
					ref={cellRef}
					rootId={rootId}
					subId={rootId}
					block={root}
					relationKey={relation.relationKey}
					getRecord={() => object}
					viewType={I.ViewType.Grid}
					readonly={!canEdit}
					idPrefix={PREFIX}
					onCellChange={onCellChange}
					pageContainer={container}
					menuParam={{ className: 'fromSidebar fixed', classNameWrap: 'fromSidebar' }}
				/>
			</div>

			{hasMore ? (
				<Icon className="more" onClick={e => relation.onMore(e, relation)} /> 
			) : ''}
		</div>
	);

}));

export default SidebarSectionObjectRelation;