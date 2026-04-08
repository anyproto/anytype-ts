import React, { forwardRef, useEffect, useRef } from 'react';
import { Cell, Icon } from 'Component';
import * as I from 'Interface';

const PREFIX = 'sidebarObjectRelation';

const SidebarSectionObjectRelation = forwardRef<I.SidebarSectionRef, I.SidebarSectionComponent>((props, ref) => {
	
	const { rootId, isPopup, item: relation } = props;
	const nodeRef = useRef(null);
	const cellRef = useRef(null);

	useEffect(() => {
		init();
	});

	const init = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const cell = U.Dom.select('.cell', node);
		const canEdit = cellRef.current?.canEdit();

		U.Dom.toggleClass(node, 'canEdit', canEdit);
		U.Dom.toggleClass(cell, 'canEdit', canEdit);
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
					menuParam={{ 
						className: 'fromSidebar fixed', 
						classNameWrap: 'fromSidebar',
					}}
				/>
			</div>

			{hasMore ? (
				<Icon name="common/more" className="more" onClick={e => relation.onMore(e, relation)} /> 
			) : ''}
		</div>
	);

});

export default SidebarSectionObjectRelation;