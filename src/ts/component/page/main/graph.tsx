import React, { forwardRef, useRef, useEffect, useState } from 'react';
import { Header, Footer, GraphProvider, GraphTimeline, Loader } from 'Component';
import * as I from 'Interface';

const PageMainGraph = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const [ data, setData ] = useState({ edges: [], nodes: [] });
	const nodeRef = useRef(null);
	const headerRef = useRef(null);
	const graphRef = useRef(null);
	const rootIdRef = useRef('');
	const key = J.Constant.graphId.global;

	const keydownHandler = useRef<(e: any) => void>(null);
	const graphRootHandler = useRef<(e: any) => void>(null);
	const sidebarResizeHandler = useRef<() => void>(null);

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
		if (graphRootHandler.current) {
			U.Dom.removeEvent(window, 'updateGraphRoot', graphRootHandler.current);
			graphRootHandler.current = null;
		};
		if (sidebarResizeHandler.current) {
			U.Dom.removeEvent(window, 'sidebarResize', sidebarResizeHandler.current);
			sidebarResizeHandler.current = null;
		};
	};

	const rebind = () => {
		unbind();

		keydownHandler.current = (e: any) => onKeyDown(e);
		graphRootHandler.current = (e: any) => {
			const d = e.detail;
			initRootId(d?.id);
		};
		sidebarResizeHandler.current = () => resize();

		U.Dom.addEvents(window, [
			['keydown', keydownHandler.current],
			['updateGraphRoot', graphRootHandler.current],
			['sidebarResize', sidebarResizeHandler.current],
		]);
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut('searchText', e, () => U.Dom.get('button-header-search')?.click());
	};

	const load = () => {
		setLoading(true);

		const settings = S.Common.getGraph(key);

		C.ObjectGraph(S.Common.space, U.Data.getGraphFilters(), 0, [], J.Relation.graph, '', [], settings.typeEdges, (message: any) => {
			if (message.error.code) {
				setLoading(false);
				return;
			};

			setData(U.Data.getGraphData(message));
		});
	};

	const setLoading = (v: boolean) => {
		const loader = U.Dom.select('#loader', nodeRef.current);
		if (!loader) {
			return;
		};

		if (v) {
			U.Dom.css(loader, { display: 'block', opacity: '1' });
		} else {
			U.Dom.css(loader, { opacity: '0' });
			window.setTimeout(() => { U.Dom.css(loader, { display: 'none' }); }, 200);
		};
	};

	const resize = () => {
		const container = U.Dom.getScrollContainer(isPopup);
		const obj = U.Dom.getPageContainer(isPopup);
		const node = nodeRef.current;
		const wrapper = U.Dom.select('.wrapper', obj);
		const header = U.Dom.select('#header', node);
		const height = (container?.clientHeight || 0) - (header?.clientHeight || 0);

		if (wrapper) {
			U.Dom.css(wrapper, { height: `${height}px` });
		};

		if (isPopup) {
			const element = U.Dom.select('#popupPage .content');
			if (element) {
				U.Dom.css(element, { minHeight: 'unset', height: '100%' });
			};
		};

		graphRef.current?.resize();
	};

	const initRootId = (id: string) => {
		rootIdRef.current = id; 
	};

	const getRootId = () => {
		return rootIdRef.current || keyboard.getRootId(isPopup);
	};

	const rootId = getRootId();

	const onTab = (id: string) => {
		const tab = U.Menu.getGraphTabs().find(it => it.id == id);

		if (tab) {
			U.Object.openAuto({ id: getRootId(), layout: tab.layout });
		};
	};

	useEffect(() => {
		rebind();
		load();
		initRootId(getRootId());
		sidebar.rightPanelClose(isPopup, false);

		return () => unbind();
	}, []);

	useEffect(() => {
		resize();

		if (data.nodes.length || data.edges.length) {
			graphRef.current?.init();
			setLoading(false);
		};
	}, [ data ]);

	useEffect(() => resize());

	return (
		<div 
			ref={nodeRef} 
			className="body"
		>
			<Header 
				{...props} 
				ref={headerRef} 
				component="mainGraph" 
				rootId={rootId} 
				tabs={U.Menu.getGraphTabs()} 
				tab="graph" 
				onTab={onTab} 
				layout={I.ObjectLayout.Graph}
			/>

			<Loader id="loader" />

			<div className="wrapper">
				<GraphProvider
					key="graph"
					{...props}
					ref={graphRef}
					id="global"
					rootId={rootId}
					data={data}
					storageKey={J.Constant.graphId.global}
					load={load}
				/>
				<GraphTimeline
					id="global"
					graphRef={graphRef}
					storageKey={J.Constant.graphId.global}
				/>
			</div>

			<Footer component="mainObject" />
		</div>
	);

});

export default PageMainGraph;