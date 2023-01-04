import * as React from 'react';
import { Icon } from 'Component';
import { I, keyboard } from 'Lib';
import { observer } from 'mobx-react';

const HeaderMainStore = observer(class HeaderMainStore extends React.Component<I.HeaderComponent> {

	render () {
		const { tabs, tab, onTab, onHome, onForward, onBack, onStore } = this.props;
		
		return (
			<React.Fragment>
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={onStore} />
					<Icon className="home big" tooltip="Home" onClick={onHome} />
					<Icon className={[ 'back', 'big', (!keyboard.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={onBack} />
					<Icon className={[ 'forward', 'big', (!keyboard.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={onForward} />
				</div>

				<div className="side center">
					<div id="tabs" className="tabs">
						{tabs.map((item: any, i: number) => (
							<div key={item.id} className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} onClick={(e: any) => { onTab(item.id); }}>
								{item.name}
							</div>
						))}
					</div>
				</div>

				<div className="side right" />
			</React.Fragment>
		);
	};

});

export default HeaderMainStore;