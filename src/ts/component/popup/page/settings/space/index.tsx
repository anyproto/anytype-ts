import * as React from 'react';
import { Icon, Label, Input, IconObject } from 'Component';
import { C, ObjectUtil, DataUtil, I, translate } from 'Lib';
import { observer } from 'mobx-react';
import { detailStore, menuStore, commonStore } from 'Store';
import Constant from 'json/constant.json';
import Head from '../head';

interface Props extends I.Popup {
	prevPage: string;
	onPage: (id: string) => void;
};

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<Props> {

	refName: any = null;
	dashboardId = '';

	constructor (props: any) {
		super(props);

		this.onDashboard = this.onDashboard.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onName = this.onName.bind(this);
	};

	render () {
		const subId = Constant.subId.space;
		const space = detailStore.get(subId, commonStore.workspace);
		const home = detailStore.get(subId, space.spaceDashboardId);
		const name = this.checkName(space.name);

		return (
			<div>
				<Head {...this.props} returnTo="index" name={translate('popupSettingsTitle')} />

				<div className="spaceInfo">
					<IconObject
						id="spaceIcon"
						size={112}
						object={space}
						forceLetter={true}
						canEdit={true}
						menuParam={{ horizontal: I.MenuDirection.Center }}
						onSelect={this.onSelect} 
						onUpload={this.onUpload} 
					/>
				</div>
	
				<div className="rows">
					<div className="row">
						<div className="name">
							<Label className="small" text="Name" />
							<Input 
								ref={ref => this.refName = ref} 
								value={name} 
								onKeyUp={this.onName} 
								placeholder={DataUtil.defaultName('page')} 
							/>
						</div>
					</div>

					<div className="row">
						<div className="side left">
							<Label text="Type" />
						</div>

						<div className="side right">
							<Label className="grey" text="Personal" />
						</div>
					</div>

					<div className="row">
						<div className="side left">
							<Label text={translate('popupSettingsSpaceHomepageTitle')} />
							<Label className="small" text="Select an object to set as your homepage" />
						</div>

						<div className="side right">
							<div id="dashboard" className="select" onClick={this.onDashboard}>
								<div className="item">
									<div className="name">
										{home._empty_ ? 'Select' : home.name}
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

	onSelect (icon: string) {
		ObjectUtil.setIcon(commonStore.workspace, icon, '');
	};

	onUpload (hash: string) {
		ObjectUtil.setIcon(commonStore.workspace, '', hash);
	};

	onDashboard () {
		const { getId } = this.props;
		const { workspace } = commonStore;
		const skipTypes = DataUtil.getFileTypes().concat(DataUtil.getSystemTypes());

		menuStore.open('searchObject', {
			element: `#${getId()} #dashboard`,
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

	onName (e: any, v: string) {
		ObjectUtil.setName(commonStore.workspace, this.checkName(v));
	};

	checkName (v: string): string {
		if ((v == DataUtil.defaultName('space')) || (v == DataUtil.defaultName('page'))) {
			v = '';
		};
		return v;
	};

});

export default PopupSettingsSpaceIndex;