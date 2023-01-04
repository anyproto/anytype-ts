import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import { Icon, Filter } from 'Component';
import { I, keyboard, DataUtil, ObjectUtil } from 'Lib';
import { commonStore } from 'Store';

class HeaderMainGraph extends React.Component<I.HeaderComponent> {

	refFilter: any = null;

	constructor (props: I.HeaderComponent) {
		super(props);
		
		this.onFilterToggle = this.onFilterToggle.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterBlur = this.onFilterBlur.bind(this);
		this.onFilterMenu = this.onFilterMenu.bind(this);
		this.onSettings = this.onSettings.bind(this);
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { onHome, onForward, onBack } = this.props;
		const { graph } = commonStore;

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
					<Icon id="button-header-search" className="search big" tooltip="Search" onClick={this.onFilterToggle} />
					
					<div id="filterWrap" className="filterWrap">
						<Filter 
							ref={(ref: any) => { this.refFilter = ref; }}
							onChange={this.onFilterChange} 
							onClear={this.onFilterClear}
							onBlur={this.onFilterBlur}
							value={graph.filter} 
						/>
					</div>

					<Icon id="button-header-filter" className="filter big" tooltip="Filters" onClick={this.onFilterMenu} />
					<Icon id="button-header-settings" className="settings big" tooltip="Settings" onClick={this.onSettings} />
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		if (!this.props.isPopup) {
			DataUtil.setWindowTitleText('Graph');
		};
	};

	onOpen () {
		ObjectUtil.openRoute({ rootId: this.props.rootId, layout: I.ObjectLayout.Graph });
	};

	onFilterChange (v: string) {
		commonStore.graphSet({ filter: v });
	};

	onFilterClear () {
		this.filterHide();
	};

	onFilterBlur (e: any) {
		this.refFilter.onClear(e);
	};

	onFilterToggle () {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('#filterWrap').hasClass('active') ? this.filterHide() : this.filterShow();
	};

	filterShow () {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('#filterWrap').addClass('active');
		this.refFilter.focus();
	};

	filterHide () {
		const node = $(ReactDOM.findDOMNode(this));

		node.find('#filterWrap').removeClass('active');
	};

	onFilterMenu () {
	};

	onSettings () {
		const { menuOpen } = this.props;

		menuOpen('graphSettings', '#button-header-settings', {
			horizontal: I.MenuDirection.Right,
		});
	};

};

export default HeaderMainGraph;