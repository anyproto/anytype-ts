import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, DataUtil, Util, keyboard, sidebar } from 'ts/lib';

import HeaderAuthIndex from './auth';
import HeaderMainIndex from './main/index';
import HeaderMainEdit from './main/edit';
import HeaderMainHistory from './main/history';
import HeaderMainGraph from './main/graph';
import HeaderMainNavigation from './main/navigation';
import HeaderMainStore from './main/store';

interface Props extends RouteComponentProps<any>, I.HeaderComponent {
	component: string;
};

const Components = {
	authIndex:			 HeaderAuthIndex,
	mainIndex:			 HeaderMainIndex,
	mainEdit:			 HeaderMainEdit,
	mainHistory:		 HeaderMainHistory,
	mainGraph:			 HeaderMainGraph,
	mainNavigation:		 HeaderMainNavigation,
	mainStore:			 HeaderMainStore,
};

class Header extends React.Component<Props, {}> {

	refChild: any = null;

	constructor (props: any) {
		super(props);

		this.onHome = this.onHome.bind(this);
		this.onSearch = this.onSearch.bind(this);
		this.onNavigation = this.onNavigation.bind(this);
		this.onGraph = this.onGraph.bind(this);
	};
	
	render () {
		const { component } = this.props;
		const Component = Components[component] || null;
		const cn = [ 'header', component ];

		if ([ 'mainEdit', 'mainNavigation', 'mainGraph', 'mainStore', 'mainHistory' ].includes(component)) {
			cn.push('isCommon');
		};

		return (
			<div id="header" className={cn.join(' ')}>
				<Component 
					ref={(ref: any) => this.refChild = ref} 
					{...this.props} 
					onHome={this.onHome}
					onBack={() => { keyboard.onBack(); }}
					onForward={() => { keyboard.onForward(); }}
					onSearch={this.onSearch}
					onNavigation={this.onNavigation}
					onGraph={this.onGraph}
				/>
			</div>
		);
	};

	componentDidMount () {
		sidebar.resizePage();
	};

	componentDidUpdate () {
		sidebar.resizePage();
		this.refChild.forceUpdate();
	};

	onHome (e: any) {
		Util.route('/main/index');
	};
	
	onSearch (e: any) {
		e.preventDefault();
		e.stopPropagation();

		keyboard.onSearchPopup();
	};

	onNavigation (e: any) {
		DataUtil.objectOpenPopup({ id: this.props.rootId, layout: I.ObjectLayout.Navigation });
	};
	
	onGraph (e: any) {
		DataUtil.objectOpenPopup({ id: this.props.rootId, layout: I.ObjectLayout.Graph });
	};

};

export default Header;