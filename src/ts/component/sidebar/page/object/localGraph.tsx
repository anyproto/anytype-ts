import React, { forwardRef, useEffect, useRef, useImperativeHandle, useState } from 'react';
import raf from 'raf';
import { Label, Icon, GraphProvider, Loader } from 'Component';
import * as I from 'Interface';

const getAppHistory = (): { listen: (fn: () => void) => () => void } | null => {
	const h = (window as any).__anytypeHistory;

	if (h && (typeof h.listen === 'function')) {
		return h;
	};

	return null;
};

const SidebarPageObjectLocalGraph = forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { rootId, isPopup, getId } = props;
	const pageId = getId?.() || '';
	const graphRef = useRef(null);
	const loadSeq = useRef(0);
	const [ data, setData ] = useState({ nodes: [], edges: [] });
	const [ isLoading, setIsLoading ] = useState(true);
	const [ navRev, setNavRev ] = useState(0);

	const focusRootId = keyboard.getRootId(isPopup) || rootId || '';

	useEffect(() => {
		const h = getAppHistory();

		if (!h) {
			return;
		};

		const unlisten = h.listen(() => setNavRev(v => v + 1));

		return () => {
			unlisten();
		};
	}, []);

	const load = () => {
		const seq = ++loadSeq.current;

		if (!focusRootId) {
			setIsLoading(false);
			setData({ nodes: [], edges: [] });

			return;
		};

		const settings = S.Common.getGraph(J.Constant.graphId.sidebarLocal);

		setIsLoading(true);
		C.ObjectGraph(
			S.Common.space,
			U.Data.getGraphFilters(),
			0,
			[],
			J.Relation.graph,
			'',
			[],
			settings.typeEdges,
			(message: any) => {
				if (seq !== loadSeq.current) {
					return;
				};

				setIsLoading(false);

				if (message.error.code) {
					return;
				};

				setData(U.Data.getGraphData(message));
			},
		);
	};

	useEffect(() => {
		load();
	}, [ focusRootId, navRev ]);

	const scheduleResize = () => {
		raf(() => {
			graphRef.current?.resize();
			window.setTimeout(() => graphRef.current?.resize(), J.Constant.delay.sidebar + 20);
		});
	};

	useEffect(() => {
		if (isLoading) {
			return;
		};

		graphRef.current?.init();
		scheduleResize();
	}, [ data, isLoading ]);

	const resize = () => {
		graphRef.current?.resize();
	};

	useEffect(() => {
		const onSidebarResize = () => scheduleResize();

		U.Dom.addEvent(window, 'sidebarResize', onSidebarResize);
		return () => {
			U.Dom.removeEvent(window, 'sidebarResize', onSidebarResize);
		};
	}, [ isLoading ]);

	useImperativeHandle(ref, () => ({
		forceUpdate: () => {},
		resize,
	}));

	const onSettings = () => {
		const element = pageId ? `#${pageId} #button-sidebar-local-graph-settings` : '#button-sidebar-local-graph-settings';

		S.Menu.closeAll(null, () => {
			S.Menu.open('graphSettings', {
				element,
				horizontal: I.MenuDirection.Left,
				classNameWrap: 'fromSidebar',
				subIds: J.Menu.graphSettings,
				data: {
					allowLocal: true,
					storageKey: J.Constant.graphId.sidebarLocal,
				},
			});
		});
	};

	return (
		<>
			<div id="head" className="head">
				<div className="side left">
					<Label text={translate('headerLocalGraph')} />
				</div>
				<div className="side right">
					<Icon
						id="button-sidebar-local-graph-settings"
						name="common/options" withBackground={true}
						tooltipParam={{ text: translate('headerGraphTooltipSettings'), typeY: I.MenuDirection.Bottom }}
						onClick={onSettings}
					/>
					<Icon
						name="common/close" withBackground={true}
						onClick={() => sidebar.rightPanelClose(isPopup, true)}
					/>
				</div>
			</div>

			<div id="body" className="body sidebarLocalGraphBody">
				{isLoading ? (
					<Loader id="loader" fitToContainer={true} isPopup={isPopup} />
				) : (
					<div className="sidebarLocalGraphWrap">
						<GraphProvider
							key={focusRootId}
							ref={graphRef}
							id="sidebarLocal"
							isPopup={isPopup}
							rootId={focusRootId}
							data={data}
							storageKey={J.Constant.graphId.sidebarLocal}
							load={load}
							navigateOnNodeClick={true}
						/>
					</div>
				)}
			</div>
		</>
	);
});

export default SidebarPageObjectLocalGraph;
