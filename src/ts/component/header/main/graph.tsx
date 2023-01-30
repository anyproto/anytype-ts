import * as React from 'react';
import { Icon } from 'Component';
import { I, keyboard, DataUtil, ObjectUtil } from 'Lib';
import { commonStore, menuStore } from 'Store';

class HeaderMainGraph extends React.Component<I.HeaderComponent> {

	refFilter: any = null;

	constructor (props: I.HeaderComponent) {
		super(props);
		
		this.onSearch = this.onSearch.bind(this);
		this.onFilter = this.onFilter.bind(this);
		this.onSettings = this.onSettings.bind(this);
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { onHome, onForward, onBack } = this.props;

		return (
			<div className="sides">
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
					<Icon className="home big" tooltip="Home" onClick={onHome} />
					<Icon className={[ 'back', 'big', (!keyboard.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={onBack} />
					<Icon className={[ 'forward', 'big', (!keyboard.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={onForward} />
				</div>

				<div className="side center" />

				<div className="side right">
					<Icon id="button-header-search" className="search big" tooltip="Search" onClick={this.onSearch} />
					<Icon id="button-header-filter" className="filter big dn" tooltip="Filters" onClick={this.onFilter} />
					<Icon id="button-header-settings" className="settings big" tooltip="Settings" onClick={this.onSettings} />
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		const { isPopup } = this.props;

		if (!isPopup) {
			DataUtil.setWindowTitleText('Graph');
		};
	};

	onOpen () {
		ObjectUtil.openRoute({ rootId: this.props.rootId, layout: I.ObjectLayout.Graph });
	};

	onSearch () {
		const { rootId } = this.props;
		const { graph } = commonStore;
		const menuParam = Object.assign({
			element: '#button-header-search',
			className: 'fromHeader',
			horizontal: I.MenuDirection.Right,
			data: {
				rootId,
				blockId: rootId,
				blockIds: [ rootId ],
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

		menuOpen('graphSettings', '#button-header-settings', {
			horizontal: I.MenuDirection.Right,
		});
	};

};

export default HeaderMainGraph;