import * as React from 'react';
import { Icon, IconObject } from 'Component';
import { I, keyboard, DataUtil, ObjectUtil } from 'Lib';
import { detailStore } from 'Store';
import { observer } from 'mobx-react';

const HeaderMainNavigation = observer(class HeaderMainNavigation extends React.Component<I.HeaderComponent> {

	constructor (props: I.HeaderComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { rootId, onHome, onForward, onBack, onGraph, onSearch, onPathOver, onPathOut } = this.props;
		const object = detailStore.get(rootId, rootId, []);

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
					<div id="path" className="path" onClick={onSearch} onMouseOver={onPathOver} onMouseOut={onPathOut}>
						<div className="inner">
							<IconObject object={object} size={18} />
							<div className="name">{object.name}</div>
						</div>
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