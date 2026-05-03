import React, { forwardRef, useEffect, useRef, useImperativeHandle, useState } from 'react';
import { Label, Icon, GraphProvider, Loader } from 'Component';
import * as I from 'Interface';

const SidebarPageObjectLocalGraph = forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const { rootId, isPopup } = props;
	const graphRef = useRef(null);
	const [ data, setData ] = useState({ nodes: [], edges: [] });
	const [ isLoading, setIsLoading ] = useState(true);

	const load = () => {
		if (!rootId) {
			return;
		};

		const settings = S.Common.getGraph(J.Constant.graphId.sidebarLocal);

		setIsLoading(true);
		C.ObjectGraph(S.Common.space, U.Data.getGraphFilters(), 0, [], J.Relation.graph, '', [], settings.typeEdges, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				return;
			};

			setData(U.Data.getGraphData(message));
		});
	};

	useEffect(() => {
		load();
	}, [ rootId ]);

	useEffect(() => {
		if (isLoading) {
			return;
		};

		graphRef.current?.init();
	}, [ data, isLoading ]);

	const resize = () => {
		graphRef.current?.resize();
	};

	useEffect(() => {
		resize();
	}, [ data, isLoading ]);

	useImperativeHandle(ref, () => ({
		forceUpdate: () => {},
		resize,
	}));

	return (
		<>
			<div id="head" className="head">
				<div className="side left">
					<Label text={translate('headerLocalGraph')} />
				</div>
				<div className="side right">
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
							{...props}
							ref={graphRef}
							id="sidebarLocal"
							rootId={rootId}
							data={data}
							storageKey={J.Constant.graphId.sidebarLocal}
							load={load}
						/>
					</div>
				)}
			</div>
		</>
	);
});

export default SidebarPageObjectLocalGraph;
