import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, keyboard, ObjectUtil, sidebar } from 'Lib';

const HeaderMainNavigation = observer(class HeaderMainNavigation extends React.Component<I.HeaderComponent, object> {

	constructor (props: I.HeaderComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { onForward, onBack, tabs, tab, onTab, onTooltipShow, onTooltipHide } = this.props;

		return (
			<React.Fragment>
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
					<Icon className="toggleSidebar big" tooltip="Sidebar" onClick={() => sidebar.expand()} />
					<Icon className={[ 'back', 'big', (!keyboard.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={onBack} />
					<Icon className={[ 'forward', 'big', (!keyboard.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={onForward} />
				</div>

				<div className="side center">
					<div id="tabs" className="tabs">
						{tabs.map((item: any, i: number) => (
							<div 
								key={i}
								className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} 
								onClick={() => { onTab(item.id); }}
								onMouseOver={e => onTooltipShow(e, item.tooltip)} 
								onMouseOut={onTooltipHide}
							>
								{item.name}
							</div>
						))}
					</div>
				</div>

				<div className="side right" />
			</React.Fragment>
		);
	};

	onOpen () {
		ObjectUtil.openRoute({ rootId: this.props.rootId, layout: I.ObjectLayout.Navigation });
	};

});

export default HeaderMainNavigation;