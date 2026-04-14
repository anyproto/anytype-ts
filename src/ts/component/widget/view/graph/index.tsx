import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import { GraphProvider } from 'Component';
import * as I from 'Interface';

const WidgetViewGraph = forwardRef<{}, I.WidgetViewComponent>((props, ref) => {
	
	const { block, getView, getObject } = props;
	const graphRef = useRef(null);
	const [ data, setData ] = useState({ edges: [], nodes: [] });
	const view = getView();

	const load = () => {
		if (!view) {
			return;
		};

		const object = getObject();
		const filters = Dataview.getActiveFilters(view).concat(U.Data.getGraphFilters()).map(it => Dataview.filterMapper(it, { rootId: object.id }));
		const isCollection = U.Object.isCollectionLayout(object.layout);
		const settings = S.Common.getGraph(J.Constant.graphId.dataview);

		C.ObjectGraph(S.Common.space, filters, 0, [], J.Relation.graph, (isCollection ? object.id : ''), object.setOf, settings.typeEdges, (message: any) => {
			if (!message.error.code) {
				setData(U.Data.getGraphData(message));
			};
		});
	};

	const resize = () => {
		graphRef.current.resize();
	};

	useEffect(() => load(), []);

	useEffect(() => {
		resize();
		graphRef.current?.init();
	}, [ data ]);

	useImperativeHandle(ref, () => ({}));

	return (
		<div className="wrap">
			<GraphProvider 
				key="graph"
				{...props} 
				ref={graphRef} 
				id={block.id}
				rootId="" 
				data={data}
				storageKey={J.Constant.graphId.dataview}
				load={load}
			/>
		</div>
	);

});

export default WidgetViewGraph;