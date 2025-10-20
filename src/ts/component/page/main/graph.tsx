import React, { forwardRef, useRef, useEffect, useState } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, C, S, U, J, keyboard, sidebar } from 'Lib';
import { Header, Footer, GraphProvider, Loader } from 'Component';

const PageMainGraph = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const [ data, setData ] = useState({ edges: [], nodes: [] });
	const nodeRef = useRef(null);
	const headerRef = useRef(null);
	const graphRef = useRef(null);
	const rootIdRef = useRef('');
	const key = J.Constant.graphId.global;

	const unbind = () => {
		const events = [ 'keydown', 'updateGraphRoot', 'removeGraphNode', 'sidebarResize' ];
		$(window).off(events.map(it => `${it}.${key}`).join(' '));
	};

	const rebind = () => {
		const win = $(window);

		unbind();
		win.on(`keydown.${key}`, e => onKeyDown(e));
		win.on(`updateGraphRoot.${key}`, (e: any, data: any) => initRootId(data.id));
		win.on(`sidebarResize.${key}`, () => resize());
	};

	const onKeyDown = (e: any) => {
		keyboard.shortcut('searchText', e, () => $('#button-header-search').trigger('click'));
	};

	const load = () => {
		setLoading(true);

		const settings = S.Common.getGraph(key);

		C.ObjectGraph(S.Common.space, U.Data.getGraphFilters(), 0, [], J.Relation.graph, '', [], settings.typeEdges, (message: any) => {
			if (message.error.code) {
				return;
			};

			setData({
				edges: message.edges,
				nodes: message.nodes.map(it => S.Detail.mapper(it))
			});

			graphRef.current?.init();
		});
	};

	const setLoading = (v: boolean) => {
		const node = $(nodeRef.current);
		const loader = node.find('#loader');

		if (v) {
			loader.show().css({ opacity: 1 });
		} else {
			loader.css({ opacity: 0 });
			window.setTimeout(() => loader.hide(), 200);
		};
	};

	const resize = () => {
		const container = U.Common.getScrollContainer(isPopup);
		const obj = U.Common.getPageContainer(isPopup);
		const node = $(nodeRef.current);
		const wrapper = obj.find('.wrapper');
		const header = node.find('#header');
		const height = container.height() - header.height();

		wrapper.css({ height });
		
		if (isPopup) {
			const element = $('#popupPage .content');
			if (element.length) {
				element.css({ minHeight: 'unset', height: '100%' });
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

		return () => unbind();
	}, []);

	useEffect(() => {
		resize();
		setLoading(false);
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
			</div>

			<Footer component="mainObject" />
		</div>
	);

}));

export default PageMainGraph;