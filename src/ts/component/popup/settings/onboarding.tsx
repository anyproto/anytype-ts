import * as React from 'react';
import { Title, Label, Select, Button } from 'Component';
import { I, UtilMenu, UtilCommon, translate, Action, analytics, Renderer } from 'Lib';
import { commonStore, authStore } from 'Store';
import { observer } from 'mobx-react';

const PopupSettingsOnboarding = observer(class PopupSettingsOnboarding extends React.Component<I.Popup> {

	config: any = {};
	refMode = null;

	constructor (props: I.Popup) {
		super(props);

		this.onUpload = this.onUpload.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onPathClick = this.onPathClick.bind(this);
		this.onChangeStorage = this.onChangeStorage.bind(this);
	};

	render () {
		const { mode, path } = this.config;
		const { interfaceLang, config } = commonStore;
		const { userDataPath } = config;
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
							<Label text={translate('popupSettingsOnboardingModeTitle')} />
							<Select
								id="networkMode"
								ref={ref => this.refMode = ref}
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
								<div onClick={() => this.onPathClick(path)}>
									<Label text={translate('popupSettingsOnboardingNetworkTitle')} />
									{path ? <Label className="small" text={UtilCommon.shorten(path, 32)} /> : ''}
								</div>
								<Button className="c28" text={translate('commonUpload')} onClick={this.onUpload} />
							</div>
						) : ''}

						{config.experimental ? (
							<div className="item">
								<div onClick={() => this.onPathClick(userDataPath)}>
									<Label text={translate('popupSettingsOnboardingStoragePath')} />
									<Label className="small" text={UtilCommon.shorten(userDataPath, 32)} />
								</div>
								<Button className="c28" text={translate('commonChange')} onClick={this.onChangeStorage} />
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
		this.forceUpdate();
	};

	onChange (key: string, value: any) {
		this.config[key] = value;
		this.forceUpdate();
	};

	onUpload () {
		Action.openFile([ 'yml' ], (paths: string[]) => this.onChange('path', paths[0]));
	};

	onSave () {
		const { networkConfig } = authStore;

		if (this.config.mode !== networkConfig.mode) {
			analytics.event('SelectNetwork', { route: 'Onboarding', type: this.config.mode });
		};

		if (this.config.path !== networkConfig.path) {
			analytics.event('UploadNetworkConfiguration', { route: 'Onboarding' });
		};

		authStore.networkConfigSet(this.config);
		this.props.close();
	};

	onPathClick (path: string) {
		Renderer.send('pathOpen', window.Electron.dirname(path));
	};

	onChangeStorage () {
		Action.openDir({}, (paths: string[]) => {
			Renderer.send('setUserDataPath', paths[0]);
		});
	};

});

export default PopupSettingsOnboarding;
