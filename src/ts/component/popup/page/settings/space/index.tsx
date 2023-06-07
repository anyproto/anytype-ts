import * as React from 'react';
import { Icon, Label, Input, IconObject } from 'Component';
import { C, ObjectUtil, DataUtil, I, translate } from 'Lib';
import { observer } from 'mobx-react';
import { detailStore, menuStore, commonStore } from 'Store';
import Constant from 'json/constant.json';

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<I.PopupSettings> {

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
		const name = this.checkName(space.name);
		const home = ObjectUtil.getSpaceDashboard();

		return (
			<React.Fragment>

				<div className="iconWrapper">
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
							<Label className="small" text="Space name" />
							<Input 
								ref={ref => this.refName = ref} 
								value={name} 
								onKeyUp={this.onName} 
								placeholder={ObjectUtil.defaultName('Page')} 
							/>
						</div>
					</div>

					<Label className="section" text="Settings" />

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
							<Label className="small" text={translate('popupSettingsSpaceHomepageText')} />
						</div>

						<div className="side right">
							<div id="dashboard" className="select" onClick={this.onDashboard}>
								<div className="item">
									{home ? <IconObject size={20} iconSize={20} object={home} /> : ''}
									<div className="name">
										{home ? home.name : 'Select'}
									</div>
								</div>
								<Icon className="arrow light" />
							</div>
						</div>
					</div>
				</div>
			</React.Fragment>
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
		const skipTypes = ObjectUtil.getFileTypes().concat(ObjectUtil.getSystemTypes());

		menuStore.open('searchObject', {
			element: `#${getId()} #dashboard`,
			horizontal: I.MenuDirection.Right,
			data: {
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: skipTypes },
				],
				canAdd: true,
				dataChange: (items: any[]) => {
					const fixed: any[] = [ ObjectUtil.graph() ];
					return !items.length ? fixed : fixed.concat([ { isDiv: true } ]).concat(items);
				},
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
		if ((v == ObjectUtil.defaultName('Space')) || (v == ObjectUtil.defaultName('Page'))) {
			v = '';
		};
		return v;
	};

});

export default PopupSettingsSpaceIndex;