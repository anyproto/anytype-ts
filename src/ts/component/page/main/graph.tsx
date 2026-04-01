import React, { forwardRef, useRef, useEffect, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Header, Footer, GraphProvider, GraphTimeline, Loader } from 'Component';
import * as I from 'Interface';

const PageMainGraph = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

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
		const events = [ 'updateGraphRoot', 'sidebarResize' ];
		$(window).off(events.map(it => `${it}.${key}`).join(' '));
		keyboard.router.popPageZone(`keydown.${key}`);
	};

	const rebind = () => {
		const win = $(window);

		unbind();
		keyboard.router.pushPageZone(`keydown.${key}`, (e) => onKeyDown(e));
		win.on(`updateGraphRoot.${key}`, (e: any, data: any) => initRootId(data.id));
		win.on(`sidebarResize.${key}`, () => resize());
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut('searchText', e, () => U.Dom.get('button-header-search')?.click());
	};

	const load = () => {
		setLoading(true);

		const settings = S.Common.getGraph(key);

		C.ObjectGraph(S.Common.space, U.Data.getGraphFilters(), 0, [], J.Relation.graph, '', [], settings.typeEdges, (message: any) => {
			setLoading(false);

			if (message.error.code) {
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
			loader.style.display = '';
			loader.style.opacity = '1';
		} else {
			loader.style.opacity = '0';
			window.setTimeout(() => { loader.style.display = 'none'; }, 200);
		};
	};

	const resize = () => {
		const container = U.Dom.getScrollContainer(isPopup);
		const obj = U.Dom.getPageContainer(isPopup);
		const node = nodeRef.current;
		const wrapper = obj?.querySelector('.wrapper') as HTMLElement;
		const header = node?.querySelector('#header') as HTMLElement;
		const height = (container?.clientHeight || 0) - (header?.clientHeight || 0);

		if (wrapper) {
			wrapper.style.height = `${height}px`;
		};

		if (isPopup) {
			const element = U.Dom.select('#popupPage .content');
			if (element) {
				element.style.minHeight = 'unset';
				element.style.height = '100%';
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
		graphRef.current?.init();
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

}));

export default PageMainGraph;
