import * as React from 'react';
import { Icon } from 'Component';
import { I, UtilObject, UtilData, keyboard, sidebar, translate } from 'Lib';
import { commonStore } from 'Store';

class HeaderMainGraph extends React.Component<I.HeaderComponent> {

	refFilter: any = null;
	rootId = '';

	constructor (props: I.HeaderComponent) {
		super(props);
		
		this.onSearch = this.onSearch.bind(this);
		this.onFilter = this.onFilter.bind(this);
		this.onSettings = this.onSettings.bind(this);
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { tab, tabs, onTab, onTooltipShow, onTooltipHide } = this.props;
		const cmd = keyboard.cmdSymbol();

		return (
			<React.Fragment>
				<div className="side left">
					<Icon
						className="toggle"
						tooltip={translate('sidebarToggle')}
						tooltipCaption={`${cmd} + \\, ${cmd} + .`}
						tooltipY={I.MenuDirection.Bottom}
						onClick={() => sidebar.toggleExpandCollapse()}
					/>
					<Icon className="expand" tooltip={translate('commonOpenObject')} onClick={this.onOpen} />
				</div>

				<div className="side center">
					<div id="tabs" className="tabs">
						{tabs.map((item: any, i: number) => (
							<div 
								key={i}
								className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} 
								onClick={() => onTab(item.id)}
								onMouseOver={e => onTooltipShow(e, item.tooltip, item.tooltipCaption)} 
								onMouseOut={onTooltipHide}
							>
								{item.name}
							</div>
						))}
					</div>
				</div>

				<div className="side right">
					<Icon id="button-header-search" className="btn-search" tooltip={translate('headerGraphTooltipSearch')} onClick={this.onSearch} />
					<Icon id="button-header-filter" className="btn-filter dn" tooltip={translate('headerGraphTooltipFilters')} onClick={this.onFilter} />
					<Icon id="button-header-settings" className="btn-settings" tooltip={translate('headerGraphTooltipSettings')} onClick={this.onSettings} />
				</div>
			</React.Fragment>
		);
	};

	componentDidMount(): void {
		this.rootId = this.props.rootId;
	};

	onOpen () {
		UtilObject.openRoute({ rootId: this.rootId, layout: I.ObjectLayout.Graph });
	};

	onSearch () {
		const { graph } = commonStore;
		const menuParam = {
			horizontal: I.MenuDirection.Right,
			data: {
				rootId: this.rootId,
				blockId: this.rootId,
				blockIds: [ this.rootId ],
				filters: UtilData.graphFilters(),
				filter: graph.filter,
				canAdd: true,
				onSelect: (item: any) => {
					$(window).trigger('updateGraphRoot', { id: item.id });
				},
				onFilterChange: (v: string) => {
					commonStore.graphSet({ filter: v });
				},
			}
		};

		this.props.menuOpen('searchObject', '#button-header-search', menuParam);
	};

	onFilter () {
	};

	onSettings () {
		this.props.menuOpen('graphSettings', '#button-header-settings', { horizontal: I.MenuDirection.Right });
	};

	setRootId (id: string) {
		this.rootId = id;
	};

};

export default HeaderMainGraph;