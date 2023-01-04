import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, keyboard, DataUtil } from 'Lib';

const HeaderMainGraph = observer(class HeaderMainGraph extends React.Component<I.HeaderComponent> {

	constructor (props: I.HeaderComponent) {
		super(props);
		
		this.onSearch = this.onSearch.bind(this);
		this.onFilter = this.onFilter.bind(this);
		this.onSettings = this.onSettings.bind(this);
	};

	render () {
		const { onHome, onForward, onBack, onGraph, onNavigation } = this.props;

		return (
			<React.Fragment>
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={onGraph} />
					<Icon className="home big" tooltip="Home" onClick={onHome} />
					<Icon className={[ 'back', 'big', (!keyboard.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={onBack} />
					<Icon className={[ 'forward', 'big', (!keyboard.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={onForward} />
					<Icon className="nav big" tooltip="Navigation" onClick={onNavigation} />
				</div>

				<div className="side center" />

				<div className="side right">
					<Icon id="button-header-search" className="search big" tooltip="Search" onClick={this.onSearch} />
					<Icon id="button-header-filter" className="filter big" tooltip="Filters" onClick={this.onFilter} />
					<Icon id="button-header-setttins" className="settings big" tooltip="Settings" onClick={this.onSettings} />
				</div>
			</React.Fragment>
		);
	};

	componentDidMount(): void {
		if (!this.props.isPopup) {
			DataUtil.setWindowTitleText('Graph');
		};
	};

	onSearch () {
	};

	onFilter () {
	};

	onSettings () {
		const { menuOpen } = this.props;

		menuOpen('graphSettings', '#button-header-sync', {
			horizontal: I.MenuDirection.Right,
		});
	};

});

export default HeaderMainGraph;