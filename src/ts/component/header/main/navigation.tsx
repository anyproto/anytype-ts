import * as React from 'react';
import { Icon } from 'Component';
import { I, keyboard, DataUtil, ObjectUtil } from 'Lib';
import { observer } from 'mobx-react';

const HeaderMainNavigation = observer(class HeaderMainNavigation extends React.Component<I.HeaderComponent> {

	constructor (props: I.HeaderComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { onHome, onForward, onBack, onGraph, tabs, tab, onTab } = this.props;

		return (
			<React.Fragment>
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
					<Icon className="home big" tooltip="Home" onClick={onHome} />
					<Icon className={[ 'back', 'big', (!keyboard.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={onBack} />
					<Icon className={[ 'forward', 'big', (!keyboard.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={onForward} />
					<Icon className="graph big" tooltip="Open as graph" onClick={onGraph} />
				</div>

				<div className="side center">
					<div id="tabs" className="tabs">
						{tabs.map((item: any) => {
							const cn = [ 'tab', (item.id == tab ? 'active' : '') ];

							console.log(item.id, tab, cn.join(' '));

							return (
								<div key={item.id} className={cn.join(' ')} onClick={() => { onTab(item.id); }}>
									{item.name}
								</div>
							);
						})}
					</div>
				</div>

				<div className="side right" />
			</React.Fragment>
		);
	};

	componentDidMount(): void {
		if (!this.props.isPopup) {
			DataUtil.setWindowTitleText('Navigation');
		};
	};

	onOpen () {
		ObjectUtil.openRoute({ rootId: this.props.rootId, layout: I.ObjectLayout.Navigation });
	};

});

export default HeaderMainNavigation;