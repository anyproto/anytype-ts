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
		const { networkConfig } = authStore;
		const { mode } = networkConfig;
		const { interfaceLang } = commonStore;
		const interfaceLanguages = UtilMenu.getInterfaceLanguages();
		const networkModes: any[] = ([
			{ id: I.NetworkMode.Default },
			{ id: I.NetworkMode.Local },
			{ id: I.NetworkMode.Custom },
		] as any[]).map(it => {
			it.name = translate(`networkMode${it.id}Title`);
			it.description = translate(`networkMode${it.id}Text`);
			it.withDescription = true;
			return it;
		});

		return (
			<div className="mainSides">
				<div id="sideRight" className="side right tabOnboarding">
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
								<Label text={translate('popupSettingsOnboardingModeTitle')} />
							</div>
							<Select
								id="networkMode"
								value={String(mode || '')}
								options={networkModes}
								onChange={v => this.onChange('mode', v)}
								arrowClassName="black"
								menuParam={{ 
									horizontal: I.MenuDirection.Right, 
									width: 300,
									className: 'fixed',
								}}
							/>
						</div>
						{mode == I.NetworkMode.Custom ? (
							<div className="item">
								<Label text={translate('popupSettingsOnboardingNetworkTitle')} />
								<Button className="c28" text={translate('commonUpload')} onClick={this.onUpload} />
							</div>
						) : ''}
					</div>

					<div className="buttons">
						<Button text={translate('commonSave')} />
					</div>
				</div>
			</div>
		);
	};

	onChange (key: string, value: any) {
		const { networkConfig } = authStore;

		networkConfig[key] = value;

		authStore.networkConfigSet(networkConfig);
		this.forceUpdate();
	};

	onUpload () {
		Action.openFile([ 'yml' ], (paths: string[]) => this.onChange('path', paths[0]));
	};
	
});

export default PopupSettingsOnboarding;
