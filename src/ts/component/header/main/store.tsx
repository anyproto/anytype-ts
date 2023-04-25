import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, keyboard, sidebar, ObjectUtil } from 'Lib';

const HeaderMainStore = observer(class HeaderMainStore extends React.Component<I.HeaderComponent, object> {

	constructor (props: I.HeaderComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { tabs, tab, onTab, onForward, onBack, onTooltipShow, onTooltipHide } = this.props;
		
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
						{tabs.map((item: any) => (
							<div 
								key={`tab-store-${item.id}`} 
								className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} 
								onClick={() => { onTab(item.id); }}
								onMouseOver={e => onTooltipShow(e, item.tooltip, item.tooltipCaption)} 
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
		ObjectUtil.openRoute({ layout: I.ObjectLayout.Store });
	};

});

export default HeaderMainStore;