import React, { forwardRef, useEffect, useState, useRef, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, J, Dataview } from 'Lib';
import { GraphProvider } from 'Component';

const PADDING = 46;

const ViewGraph = observer(forwardRef<I.ViewRef, I.ViewComponent>((props, ref) => {

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
		const filters = [].concat(view.filters).concat(U.Data.getGraphFilters()).map(it => Dataview.filterMapper(it, { rootId }));
		const settings = S.Common.getGraph(J.Constant.graphId.dataview);
		const target = getTarget();

		if (searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
		};

		C.ObjectGraph(S.Common.space, filters, 0, [], J.Relation.graph, (isCollection ? target.id : ''), target.setOf, settings.typeEdges, (message: any) => {
			if (!message.error.code) {
				setData({ nodes: message.nodes.map(it => S.Detail.mapper(it)), edges: message.edges });
			};
		});
	};

	const resize = () => {
		const node = $(nodeRef.current);

		if (!node.length) {
			return;
		};

		if (!isInline) {
			node.css({ width: 0, height: 0, marginLeft: 0 });

			const container = U.Common.getPageContainer(isPopup);
			const cw = container.width();
			const ch = container.height();
			const mw = cw - PADDING * 2;
			const margin = (cw - mw) / 2;
			const { top } = node.offset();

			node.css({ width: cw, height: Math.max(600, ch - top - 2), marginLeft: -margin - 2 });
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

}));

export default ViewGraph;