import * as React from 'react';
import { Title, Label, Select, Button, Switch } from 'Component';
import { I, UtilMenu, translate, Action } from 'Lib';
import { commonStore, authStore } from 'Store';
import { observer } from 'mobx-react';

const PopupSettingsOnboarding = observer(class PopupSettingsOnboarding extends React.Component<I.Popup> {

	constructor (props: I.Popup) {
		super(props);

		this.onUpload = this.onUpload.bind(this);
	};

	render () {
		const { storageGet } = this.props
		const obj = storageGet();
		const { interfaceLang } = commonStore;
		const interfaceLanguages = UtilMenu.getInterfaceLanguages();
		const cnr = [ 'side', 'right', 'tabOnboarding' ];

		return (
			<div className="mainSides">
				<div id="sideRight" className={cnr.join(' ')}>
					<Title text={translate('popupSettingsPersonalTitle')} />

					<div className="actionItems">
						<div className="item">
							<Label text={translate('popupSettingsPersonalInterfaceLanguage')} />

							<Select
								id="interfaceLang"
								value={interfaceLang}
								options={interfaceLanguages}
								onChange={v => Action.setInterfaceLang(v)}
								arrowClassName="black"
								menuParam={{ 
									horizontal: I.MenuDirection.Right, 
									width: 300,
									className: 'fixed',
								}}
							/>
						</div>
						<div className="item">
							<div>
								<Label text={translate('popupSettingsOnboardingLocalModeTitle')} />
								<Label className="small" text={translate('popupSettingsOnboardingLocalModeText')} />
							</div>
							<Switch className="big" value={obj.local} onChange={(e: any, v: boolean) => this.onChange('local', v)} />
						</div>
						<div className="item">
							<div>
								<Label text={translate('popupSettingsOnboardingSelfTitle')} />
								<Label className="small" text={translate('popupSettingsOnboardingSelfText')} />
							</div>
							<Switch className="big" value={obj.self} onChange={(e: any, v: boolean) => this.onChange('self', v)} />
						</div>
						<div className="item">
							<Label text={translate('popupSettingsOnboardingNetworkTitle')} />
							<Button className="c28" text={translate('commonUpload')} onClick={this.onUpload} />
						</div>
					</div>

					<div className="buttons">
						<Button text={translate('commonSave')} />
					</div>
				</div>
			</div>
		);
	};

	onChange (key: string, value: any) {
		const { storageGet, storageSet } = this.props;
		const obj: any = storageGet();

		obj[key] = value;

		storageSet(obj);
	};

	onUpload () {
		Action.openFile([ 'yml' ], (paths: string[]) => this.onChange('configPath', paths[0]));
	};
	
});

export default PopupSettingsOnboarding;
