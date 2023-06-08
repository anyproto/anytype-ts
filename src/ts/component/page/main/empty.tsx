import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, IconObject, Header, Icon } from 'Component';
import { I, C, UtilMenu, UtilObject } from 'Lib';
import { detailStore, commonStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

const PageMainEmpty = observer(class PageMainEmpty extends React.Component<I.PageComponent> {

	node = null;

	constructor (props: I.PageComponent) {
		super(props);

		this.onDashboard = this.onDashboard.bind(this);
	};
	
	render () {
		const space = detailStore.get(Constant.subId.space, commonStore.workspace);
		const home = UtilObject.getSpaceDashboard();

		return (
			<div 
				ref={node => this.node = node}
				className="wrapper"
			>
				<Header component="mainEmpty" text="Search" layout={I.ObjectLayout.Space} {...this.props} />

				<div className="wrapper">
					<IconObject object={space} size={112} forceLetter={true} />
					<Title text={space.name} />
					<Label text="Select an object to show when you login. You can always change it in Settings." />
							
					<div className="row">
						<div className="side left">
							<Label text="Homepage" />
						</div>

						<div className="side right">
							<div id="empty-dashboard-select" className="select" onClick={this.onDashboard}>
								<div className="item">
									<div className="name">
										{home ? home.name : 'Select'}
									</div>
								</div>
								<Icon className="arrow light" />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};
	
	onDashboard () {
		UtilMenu.dashboardSelect('#empty-dashboard-select');
	};

});

export default PageMainEmpty;