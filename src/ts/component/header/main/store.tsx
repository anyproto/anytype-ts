import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, Util, DataUtil, keyboard } from 'ts/lib';
import { popupStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	isPopup?: boolean;
	dataset?: any;
	tabs: any[];
	tab: string;
	onTab: (id: string) => void;
}

const HeaderMainStore = observer(class HeaderMainStore extends React.Component<Props, {}> {

	timeout: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onHome = this.onHome.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { tabs, tab, onTab } = this.props;
		
		return (
			<div id="header" className="header headerMainEdit">
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
					<Icon className="home big" tooltip="Home" onClick={this.onHome} />
					<Icon className={[ 'back', 'big', (!keyboard.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={this.onBack} />
					<Icon className={[ 'forward', 'big', (!keyboard.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={this.onForward} />
				</div>

				<div className="side center">
					<div className="tabs">
						{tabs.map((item: any, i: number) => (
							<div key={item.id} className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} onClick={(e: any) => { onTab(item.id); }}>
								{item.name}
							</div>
						))}
					</div>
				</div>

				<div className="side right" />
			</div>
		);
	};

	componentDidMount () {
		Util.resizeSidebar();
	};

	componentDidUpdate () {
		Util.resizeSidebar();	
	};

	onHome (e: any) {
		Util.route('/main/index');
	};
	
	onBack (e: any) {
		keyboard.back();
	};
	
	onForward (e: any) {
		keyboard.forward();
	};

	onOpen () {
		const { rootId } = this.props;

		popupStore.closeAll(null, () => {
			DataUtil.objectOpen({ id: rootId, layout: I.ObjectLayout.Store });
		});
	};

});

export default HeaderMainStore;