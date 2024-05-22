import * as React from 'react';
import { Icon } from 'Component';
import { I, UtilData, translate } from 'Lib';
import { commonStore } from 'Store';
const Constant = require('json/constant.json');

class HeaderMainGraph extends React.Component<I.HeaderComponent> {

	refFilter: any = null;
	rootId = '';

	constructor (props: I.HeaderComponent) {
		super(props);
		
		this.onSearch = this.onSearch.bind(this);
		this.onFilter = this.onFilter.bind(this);
		this.onSettings = this.onSettings.bind(this);
	};

	render () {
		const { renderLeftIcons, renderTabs } = this.props;

		return (
			<React.Fragment>
				<div className="side left">{renderLeftIcons()}</div>
				<div className="side center">{renderTabs()}</div>

				<div className="side right">
					<Icon id="button-header-search" className="btn-search" tooltip={translate('headerGraphTooltipSearch')} onClick={this.onSearch} />
					<Icon id="button-header-filter" className="btn-filter dn" tooltip={translate('headerGraphTooltipFilters')} onClick={this.onFilter} />
					<Icon id="button-header-settings" className="btn-settings" tooltip={translate('headerGraphTooltipSettings')} onClick={this.onSettings} />
				</div>
			</React.Fragment>
		);
	};

	componentDidMount(): void {
		this.setRootId(this.props.rootId);
	};

	onSearch () {
		this.props.menuOpen('searchObject', '#button-header-search', {
			horizontal: I.MenuDirection.Right,
			data: {
				rootId: this.rootId,
				blockId: this.rootId,
				blockIds: [ this.rootId ],
				filters: UtilData.graphFilters(),
				filter: commonStore.getGraph(Constant.graphId.global).filter,
				canAdd: true,
				onSelect: (item: any) => {
					$(window).trigger('updateGraphRoot', { id: item.id });
				},
				onFilterChange: (v: string) => {
					commonStore.graphSet(Constant.graphId.global, { filter: v });
				},
			}
		});
	};

	onFilter () {
	};

	onSettings () {
		this.props.menuOpen('graphSettings', '#button-header-settings', { 
			horizontal: I.MenuDirection.Right,
			data: {
				allowLocal: true,
				storageKey: Constant.graphId.global,
			}
		});
	};

	setRootId (id: string) {
		this.rootId = id;
	};

};

export default HeaderMainGraph;