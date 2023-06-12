import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Label, Input, IconObject } from 'Component';
import { UtilObject, UtilMenu, I, translate } from 'Lib';
import { commonStore } from 'Store';

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
		const space = UtilObject.getSpace() || {};
		const name = this.checkName(space.name);
		const home = UtilObject.getSpaceDashboard();

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
								placeholder={UtilObject.defaultName('Page')} 
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
		UtilObject.setIcon(commonStore.workspace, icon, '');
	};

	onUpload (hash: string) {
		UtilObject.setIcon(commonStore.workspace, '', hash);
	};

	onDashboard () {
		UtilMenu.dashboardSelect(`#${this.props.getId()} #dashboard`);
	};

	onName (e: any, v: string) {
		UtilObject.setName(commonStore.workspace, this.checkName(v));
	};

	checkName (v: string): string {
		if ((v == UtilObject.defaultName('Space')) || (v == UtilObject.defaultName('Page'))) {
			v = '';
		};
		return v;
	};

});

export default PopupSettingsSpaceIndex;