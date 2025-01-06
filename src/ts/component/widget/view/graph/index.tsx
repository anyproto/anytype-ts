import React, { forwardRef, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { I, C, S, U, J, Dataview } from 'Lib';
import { GraphProvider } from 'Component';

const WidgetViewGraph = observer(forwardRef<{}, I.WidgetViewComponent>((props, ref) => {
	
	const { block, getView, getObject } = props;
	const graphRef = useRef(null);
	const data = useRef({} as any);
	const view = getView();

	const load = () => {
		if (!view) {
			return;
		};

		const filters = [].concat(view.filters).concat(U.Data.graphFilters()).map(it => Dataview.filterMapper(view, it));
		const object = getObject();
		const isCollection = U.Object.isCollectionLayout(object.layout);

		C.ObjectGraph(S.Common.space, filters, 0, [], J.Relation.graph, (isCollection ? object.id : ''), object.setOf, (message: any) => {
			data.current.edges = message.edges;
			data.current.nodes = message.nodes;

			if (graphRef.current) {
				graphRef.current.init();
			};
		});
	};

	const resize = () => {
		graphRef.current.resize();
	};

	useEffect(() => load(), []);
	useEffect(() => resize());

	return (
		<div className="wrap">
			<GraphProvider 
				key="graph"
				{...props} 
				ref={graphRef} 
				id={block.id}
				rootId="" 
				data={data.current}
				storageKey={J.Constant.graphId.dataview}
			/>
		</div>
	);

}));

export default WidgetViewGraph;