import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, IconObject, Header, Icon } from 'Component';
import { I, C, Util, DataUtil, ObjectUtil } from 'Lib';
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
		const home = ObjectUtil.getSpaceDashboard();

		return (
			<div 
				ref={node => this.node = node}
				className="wrapper"
			>
				<Header component="mainEmpty" text="Search" layout={I.ObjectLayout.Space} {...this.props} />

				<div className="wrapper">
					<IconObject object={space} size={112} forceLetter={true} />
					<Title text={space.name} />
					<Label text="Select an object to set as your homepage. You can always change it in Settings." />
							
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
		const { workspace } = commonStore;
		const skipTypes = ObjectUtil.getFileTypes().concat(ObjectUtil.getSystemTypes());

		menuStore.open('searchObject', {
			element: `#empty-dashboard-select`,
			horizontal: I.MenuDirection.Right,
			data: {
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: skipTypes },
				],
				canAdd: true,
				onSelect: (el: any) => {
					C.ObjectWorkspaceSetDashboard(workspace, el.id, (message: any) => {
						if (message.error.code) {
							return;
						};

						detailStore.update(Constant.subId.space, { id: workspace, details: { spaceDashboardId: el.id } }, false);
						detailStore.update(Constant.subId.space, { id: el.id, details: el }, false);

						ObjectUtil.openHome('route');
					});
				}
			}
		});
	};

});

export default PageMainEmpty;