import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { ObjectName, Label, IconObject, Header, Footer, Icon } from 'Component';
import { I, U, translate } from 'Lib';

const PageMainEmpty = observer(forwardRef<{}, I.PageComponent>((props, ref) => {

	const space = U.Space.getSpaceview();
	const home = U.Space.getDashboard();

	const onDashboard = () => {
		U.Menu.dashboardSelect('.pageMainEmpty #empty-dashboard-select', true);
	};

	return (
		<div className="wrapper">
			<Header 
				{...props} 
				component="mainEmpty" 
				text={translate('commonSearch')}
				layout={I.ObjectLayout.SpaceView}
			/>

			<div className="wrapper">
				<IconObject object={space} size={96} />
				<ObjectName className="title" object={space} />
				<Label text={translate('pageMainEmptyDescription')} />
						
				<div className="row">
					<div className="side left">
						<Label text={translate('commonHomepage')} />
					</div>

					<div className="side right">
						<div id="empty-dashboard-select" className="select" onClick={onDashboard}>
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

}));

export default PageMainEmpty;