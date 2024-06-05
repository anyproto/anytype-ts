import * as React from 'react';
import { observer } from 'mobx-react';
import { I, Dataview } from 'Lib';
import { dbStore } from 'Store';
import Group from './group';

const Constant = require('json/constant.json');

const WidgetViewBoard = observer(class WidgetViewBoard extends React.Component<I.WidgetViewComponent> {

	node = null;

	constructor (props: I.WidgetViewComponent) {
		super(props);
	};

	render (): React.ReactNode {
		const { block, getView } = this.props;
		const view = getView();
		const groups = this.getGroups(false);
		const relation = dbStore.getRelationByKey(view.groupRelationKey);

		return (
			<div ref={ref => this.node = ref} className="body">
				{groups.map(group => (
					<Group 
						key={`widget-${view.id}-group-${block.id}-${group.id}`} 
						{...this.props}
						{...group}
					/>
				))}
			</div>
		);
	};

	componentDidMount(): void {
		this.load();
	};

	load () {
		const { rootId, getView, getObject } = this.props;
		const view = getView();
		const blockId = Constant.blockId.dataview;
		const object = getObject();

		if (!view) {
			return;
		};

		dbStore.groupsClear(rootId, blockId);

		if (!view.groupRelationKey) {
			this.forceUpdate();
			return;
		};

		Dataview.loadGroupList(rootId, blockId, view.id, object);
	};

	getGroups (withHidden: boolean) {
		const { rootId, getView } = this.props;
		const view = getView();

		return Dataview.getGroups(rootId, Constant.blockId.dataview, view.id, withHidden);
	};

});

export default WidgetViewBoard;