import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject } from 'ts/component';
import { I, Util, DataUtil, keyboard } from 'ts/lib';
import { blockStore, detailStore, popupStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any>, I.HeaderComponent {};

const $ = require('jquery');

const HeaderMainNavigation = observer(class HeaderMainNavigation extends React.Component<Props, {}> {

	timeout: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.onPathOver = this.onPathOver.bind(this);
		this.onPathOut = this.onPathOut.bind(this);
	};

	render () {
		const { rootId, onHome, onForward, onBack, onGraph, onSearch } = this.props;
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
					<div id="path" className="path" onMouseDown={onSearch} onMouseOver={this.onPathOver} onMouseOut={this.onPathOut}>
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

	onOpen () {
		const { rootId } = this.props;

		popupStore.closeAll(null, () => {
			DataUtil.objectOpen({ id: rootId, layout: I.ObjectLayout.Navigation });
		});
	};

	onPathOver (e: any) {
		Util.tooltipShow('Click to search', $(e.currentTarget), I.MenuDirection.Center, I.MenuDirection.Bottom);
	};

	onPathOut () {
		Util.tooltipHide(false);
	};

});

export default HeaderMainNavigation;