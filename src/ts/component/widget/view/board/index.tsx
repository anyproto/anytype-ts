import React, { forwardRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { I, S, J, Dataview } from 'Lib';
import Group from './group';

const WidgetViewBoard = observer(forwardRef<{}, I.WidgetViewComponent>((props, ref) => {

	const { rootId, block, getView, getObject, getViewLimit, isPreview } = props;
	const view = getView();
	const object = getObject();
	const blockId = J.Constant.blockId.dataview;
	const [ dummy, setDummy ] = useState(0);
	const limit = getViewLimit();

	const load = () => {
		if (view && view.groupRelationKey) {
			Dataview.loadGroupList(rootId, blockId, view.id, object);
		} else {
			setDummy(dummy + 1);
		};
	};

	let groups = Dataview.getGroups(rootId, blockId, view.id, false);
	if (!isPreview && groups.length > limit) {
		groups = groups.slice(0, limit);
	};

	useEffect(() => load(), []);
	useEffect(() => load(), [ view?.id ]);

	return (
		<div className="body">
			{groups.map(group => (
				<Group 
					key={`widget-${view.id}-group-${block.id}-${group.id}`} 
					{...props}
					{...group}
				/>
			))}
		</div>
	);

}));

export default WidgetViewBoard;
