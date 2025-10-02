import React, { forwardRef, useEffect, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { I, S, J, Dataview } from 'Lib';
import Group from './group';

interface WidgetViewBoardRefProps {
	load: (searchIds: string[]) => void;
};

const WidgetViewBoard = observer(forwardRef<WidgetViewBoardRefProps, I.WidgetViewComponent>((props, ref) => {

	const { rootId, block, getView, getObject, getViewLimit, isPreview } = props;
	const view = getView();
	const object = getObject();
	const blockId = J.Constant.blockId.dataview;
	const [ searchIds, setSearchIds ] = useState<string[]>([]);
	const limit = getViewLimit();

	const load = (searchIds: string[]) => {
		if (view && view.groupRelationKey) {
			Dataview.loadGroupList(rootId, blockId, view.id, object);
		};
		setSearchIds(searchIds);
	};

	let groups = Dataview.getGroups(rootId, blockId, view.id, false);
	if (!isPreview && groups.length > limit) {
		groups = groups.slice(0, limit);
	};

	useEffect(() => load(searchIds), [ view?.id ]);

	useImperativeHandle(ref, () => ({
		load,
	}));

	return (
		<div className="body">
			{groups.map(group => (
				<Group 
					key={`widget-${view.id}-group-${block.id}-${group.id}`} 
					{...props}
					{...group}
					searchIds={searchIds}
				/>
			))}
		</div>
	);

}));

export default WidgetViewBoard;
