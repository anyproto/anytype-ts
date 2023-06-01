import * as React from 'react';
import { Icon } from 'Component';
import { I, ObjectUtil, DataUtil, keyboard, sidebar } from 'Lib';
import { commonStore, menuStore } from 'Store';

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
						className="toggle big"
						tooltip="Toggle sidebar fixed mode"
						tooltipCaption={`${cmd} + \\, ${cmd} + .`}
						tooltipY={I.MenuDirection.Bottom}
						onClick={() => sidebar.toggleExpandCollapse()}
					/>
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
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
					<Icon id="button-header-search" className="btn-search big" tooltip="Search" onClick={this.onSearch} />
					<Icon id="button-header-filter" className="btn-filter big dn" tooltip="Filters" onClick={this.onFilter} />
					<Icon id="button-header-settings" className="btn-settings big" tooltip="Settings" onClick={this.onSettings} />
				</div>
			</React.Fragment>
		);
	};

	componentDidMount(): void {
		this.rootId = this.props.rootId;
	};

	onOpen () {
		ObjectUtil.openRoute({ rootId: this.rootId, layout: I.ObjectLayout.Graph });
	};

	onSearch () {
		const { graph } = commonStore;
		const menuParam = Object.assign({
			element: '#button-header-search',
			className: 'fromHeader',
			horizontal: I.MenuDirection.Right,
			data: {
				rootId: this.rootId,
				blockId: this.rootId,
				blockIds: [ this.rootId ],
				filters: DataUtil.graphFilters(),
				filter: graph.filter,
				canAdd: true,
				onSelect: (item: any) => {
					$(window).trigger('updateGraphRoot', { id: item.id });
				},
				onFilterChange: (v: string) => {
					commonStore.graphSet({ filter: v });
				},
			}
		});

		menuStore.open('searchObject', menuParam);
	};

	onFilter () {
	};

	onSettings () {
		const { menuOpen } = this.props;

		menuOpen('graphSettings', '#button-header-settings', { horizontal: I.MenuDirection.Right });
	};

	setRootId (id: string) {
		this.rootId = id;
	};

};

export default HeaderMainGraph;