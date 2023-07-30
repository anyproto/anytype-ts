import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, IconObject, Header, Footer, Icon } from 'Component';
import { I, UtilMenu, UtilObject, translate } from 'Lib';

const PageMainEmpty = observer(class PageMainEmpty extends React.Component<I.PageComponent> {

	node = null;

	constructor (props: I.PageComponent) {
		super(props);

		this.onDashboard = this.onDashboard.bind(this);
	};
	
	render () {
		const space = UtilObject.getSpace();
		const home = UtilObject.getSpaceDashboard();

		return (
			<div 
				ref={node => this.node = node}
				className="wrapper"
			>
				<Header component="mainEmpty" text={translate('commonSearch')} layout={I.ObjectLayout.Space} {...this.props} />

				<div className="wrapper">
					<IconObject object={space} size={112} forceLetter={true} />
					<Title text={space.name} />
					<Label text={translate('pageMainEmptyDescription')} />
							
					<div className="row">
						<div className="side left">
							<Label text={translate('commonHomepage')} />
						</div>

						<div className="side right">
							<div id="empty-dashboard-select" className="select" onClick={this.onDashboard}>
								<div className="item">
									<div className="name">
										{home ? home.name : translate('commonSelect')}
									</div>
								</div>
								<Icon className="arrow light" />
							</div>
						</div>
					</div>
				</div>

				<Footer component="mainObject" />
			</div>
		);
	};
	
	onDashboard () {
		UtilMenu.dashboardSelect('#empty-dashboard-select', true);
	};

});

export default PageMainEmpty;
