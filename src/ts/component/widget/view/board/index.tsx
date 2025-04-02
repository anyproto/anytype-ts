import React, { forwardRef, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { I, S, J, Dataview } from 'Lib';
import Group from './group';

const WidgetViewBoard = observer(forwardRef<{}, I.WidgetViewComponent>((props, ref) => {

	const { rootId, block, getView, getObject } = props;
	const view = getView();
	const object = getObject();
	const blockId = J.Constant.blockId.dataview;
	const groups = Dataview.getGroups(rootId, blockId, view.id, false);
	const [ dummy, setDummy ] = useState(0);

	const load = () => {
		if (!view) {
			return;
		};

		S.Record.groupsClear(rootId, blockId);

		if (view.groupRelationKey) {
			Dataview.loadGroupList(rootId, blockId, view.id, object);
		} else {
			setDummy(dummy + 1);
		};
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