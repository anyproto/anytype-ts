import React, { forwardRef, useRef, useEffect } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';

const HeaderMainGraph = forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { renderLeftIcons, renderTabs, menuOpen, rootId } = props;
	const rootIdRef = useRef('');

	const graphRootHandler = useRef((e: any) => initRootId(e.detail.id));

	const unbind = () => {
		U.Dom.removeEvent(window, 'updateGraphRoot', graphRootHandler.current);
	};

	const rebind = () => {
		unbind();
		U.Dom.addEvent(window, 'updateGraphRoot', graphRootHandler.current);
	};

	const onSearch = () => {
		const rootId = rootIdRef.current;

		menuOpen('searchObject', '#button-header-search', {
			horizontal: I.MenuDirection.Right,
			data: {
				rootId,
				blockId: rootId,
				blockIds: [ rootId ],
				filters: U.Data.getGraphFilters(),
				filter: S.Common.getGraph(J.Constant.graphId.global).filter,
				canAdd: true,
				withPlural: true,
				onSelect: (item: any) => {
					U.Dom.eventDispatch(window, 'updateGraphRoot', { id: item.id });
				},
				onFilterChange: (v: string) => {
					S.Common.graphSet(J.Constant.graphId.global, { filter: v });
				},
			}
		});
	};

	const onFilter = () => {
	};

	const onSettings = () => {
		menuOpen('graphSettings', '#button-header-settings', { 
			horizontal: I.MenuDirection.Right,
			subIds: J.Menu.graphSettings,
			data: {
				allowLocal: true,
				storageKey: J.Constant.graphId.global,
			}
		});
	};

	const initRootId = (id: string) => {
		rootIdRef.current = id;
	};

	useEffect(() => {
		initRootId(rootId);
		rebind();

		return () => unbind();
	}, []);

	return (
		<>
			<div className="side left">{renderLeftIcons(true, false)}</div>
			<div className="side center">{renderTabs()}</div>

			<div className="side right">
				<Icon
					id="button-header-search"
					name="header/search" withBackground={true}
					tooltipParam={{ text: translate('headerGraphTooltipSearch'), typeY: I.MenuDirection.Bottom }}
					onClick={onSearch}
				/>

				<Icon
					id="button-header-filter"
					name="control/dataview/filter"
					className="btn-filter dn" withBackground={true}
					tooltipParam={{ text: translate('headerGraphTooltipFilters'), typeY: I.MenuDirection.Bottom }}
					onClick={onFilter}
				/>

				<Icon
					id="button-header-settings"
					name="common/options"
					className="btn-settings" withBackground={true}
					tooltipParam={{ text: translate('headerGraphTooltipSettings'), typeY: I.MenuDirection.Bottom }}
					onClick={onSettings}
				/>
			</div>
		</>
	);

});

export default HeaderMainGraph;
