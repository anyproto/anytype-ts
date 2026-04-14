import React, { forwardRef, useEffect, useState, useRef, useImperativeHandle } from 'react';
import { GraphProvider } from 'Component';
import * as I from 'Interface';

const PADDING = 46;

const ViewGraph = forwardRef<I.ViewRef, I.ViewComponent>((props, ref) => {

	const { rootId, block, className, isCollection, isPopup, isInline, getView, getSearchIds, getTarget } = props;
	const cn = [ 'viewContent', className ];
	const nodeRef = useRef(null);
	const graphRef = useRef(null);
	const [ data, setData ] = useState({ nodes: [], edges: [] });

	const load = () => {
		const view = getView();
		if (!view) {
			return;
		};

		const searchIds = getSearchIds();
		const filters = Dataview.getActiveFilters(view).concat(U.Data.getGraphFilters()).map(it => Dataview.filterMapper(it, { rootId }));
		const settings = S.Common.getGraph(J.Constant.graphId.dataview);
		const target = getTarget();

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		C.ObjectGraph(S.Common.space, filters, 0, [], J.Relation.graph, (isCollection ? target.id : ''), target.setOf, settings.typeEdges, (message: any) => {
			if (!message.error.code) {
				setData(U.Data.getGraphData(message));
			};
		});
	};

	const resize = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		if (!isInline) {
			U.Dom.css(node, { width: '0px', height: '0px', marginLeft: '0px' });

			const container = U.Dom.getPageContainer(isPopup);
			const cw = container?.clientWidth ?? 0;
			const ch = container?.clientHeight ?? 0;
			const mw = cw - PADDING * 2;
			const margin = (cw - mw) / 2;
			const { top } = node.getBoundingClientRect();

			U.Dom.css(node, { width: `${cw}px`, height: `${Math.max(600, ch - top - 2)}px`, marginLeft: `${-margin - 2}px` });
		};

		graphRef.current?.resize();
	};

	useEffect(() => resize());

	useImperativeHandle(ref, () => ({
		load,
		resize,
	}));

	useEffect(() => {
		graphRef.current?.init();
		resize();
	}, [ data ]);

	return (
		<div 
			ref={nodeRef} 
			className="wrap"
		>
			<div className={cn.join(' ')}>
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
		</div>
	);

});

export default ViewGraph;
