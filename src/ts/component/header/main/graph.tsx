import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { Icon } from 'Component';
import { I, S, U, J, translate } from 'Lib';

const HeaderMainGraph = forwardRef<{}, I.HeaderComponent>((props, ref) => {

	const { renderLeftIcons, renderTabs, menuOpen, rootId } = props;
	const rootIdRef = useRef('');

	const unbind = () => {
		$(window).off(`updateGraphRoot.header`);
	};

	const rebind = () => {
		const win = $(window);

		unbind();
		win.on('updateGraphRoot.header', (e: any, data: any) => initRootId(data.id));
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
					$(window).trigger('updateGraphRoot', { id: item.id });
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
			<div className="side left">{renderLeftIcons(false)}</div>
			<div className="side center">{renderTabs()}</div>

			<div className="side right">
				<Icon 
					id="button-header-search" 
					className="btn-search withBackground" 
					tooltipParam={{ text: translate('headerGraphTooltipSearch'), typeY: I.MenuDirection.Bottom }} 
					onClick={onSearch} 
				/>

				<Icon 
					id="button-header-filter" 
					className="btn-filter withBackground dn" 
					tooltipParam={{ text: translate('headerGraphTooltipFilters'), typeY: I.MenuDirection.Bottom }} 
					onClick={onFilter} 
				/>

				<Icon 
					id="button-header-settings" 
					className="btn-settings withBackground" 
					tooltipParam={{ text: translate('headerGraphTooltipSettings'), typeY: I.MenuDirection.Bottom }} 
					onClick={onSettings} 
				/>
			</div>
		</>
	);

});

export default HeaderMainGraph;
