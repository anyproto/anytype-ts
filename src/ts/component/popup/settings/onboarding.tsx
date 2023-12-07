import * as React from 'react';
import { Title, Label, Select, Button } from 'Component';
import { I, UtilMenu, translate, Action, analytics } from 'Lib';
import { commonStore, authStore } from 'Store';
import { observer } from 'mobx-react';

const PopupSettingsOnboarding = observer(class PopupSettingsOnboarding extends React.Component<I.Popup> {

	config: any = {};
	refMode = null;

	constructor (props: I.Popup) {
		super(props);

		this.onUpload = this.onUpload.bind(this);
		this.onSave = this.onSave.bind(this);
	};

	render () {
		const { mode } = this.config;
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
								ref={ref => this.refMode = ref}
								value={String(mode || '')}
								options={networkModes}
								onChange={v => {
									this.onChange('mode', v);
									analytics.event('SelectNetwork', { type: v, route: 'Onboarding' });
								}}
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
						<Button text={translate('commonSave')} onClick={this.onSave} />
					</div>
				</div>
			</div>
		);
	};

	componentDidMount(): void {
		this.config = authStore.networkConfig;
		this.refMode?.setValue(this.config.mode);
	};

	onChange (key: string, value: any) {
		this.config[key] = value;
		this.forceUpdate();
	};

	onUpload () {
		Action.openFile([ 'yml' ], (paths: string[]) => {
			this.onChange('path', paths[0]);
			analytics.event('UploadNetworkConfiguration', { route: 'Onboarding' });
		});
	};

	onSave () {
		authStore.networkConfigSet(this.config);
		this.props.close();
	};
	
});

export default PopupSettingsOnboarding;
