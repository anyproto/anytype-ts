import * as React from 'react';
import { Title, Label, Select, Button } from 'Component';
import { I, UtilMenu, UtilCommon, translate, Action, analytics, Renderer, Preview } from 'Lib';
import { commonStore, authStore, popupStore } from 'Store';
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
		this.onTooltipShow = this.onTooltipShow.bind(this);
		this.onTooltipHide = this.onTooltipHide.bind(this);
	};

	render () {
		const { mode, path, userPath } = this.config;
		const { interfaceLang, config } = commonStore;
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
							<div className="item" onMouseEnter={e => this.onTooltipShow(e, path)} onMouseLeave={this.onTooltipHide}>
								<div onClick={() => this.onPathClick(path)}>
									<Label text={translate('popupSettingsOnboardingNetworkTitle')} />
									{path ? <Label className="small" text={UtilCommon.shorten(path, 32)} /> : ''}
								</div>
								<Button className="c28" text={translate('commonUpload')} onClick={this.onUpload} />
							</div>
						) : ''}

						{config.experimental ? (
							<div className="item" onMouseEnter={e => this.onTooltipShow(e, userPath)} onMouseLeave={this.onTooltipHide}>
								<div onClick={() => this.onPathClick(userPath)}>
									<Label text={translate('popupSettingsOnboardingStoragePath')} />
									<Label className="small" text={UtilCommon.shorten(userPath, 32)} />
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
		const { networkConfig } = authStore;
		const { mode, path } = networkConfig;
		const userPath = window.Electron.userPath();

		this.config = {
			userPath,
			mode,
			path: path || ''
		};
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
		const userPath = window.Electron.userPath();

		const callBack = () => {
			if (this.config.mode !== networkConfig.mode) {
				analytics.event('SelectNetwork', { route: 'Onboarding', type: this.config.mode });
			};

			if (this.config.path !== networkConfig.path) {
				analytics.event('UploadNetworkConfiguration', { route: 'Onboarding' });
			};

			if (this.config.userPath !== userPath) {
				Renderer.send('setUserDataPath', this.config.userPath);
				commonStore.dataPathSet(this.config.userPath);
				delete this.config.userPath;
			};

			authStore.networkConfigSet(this.config);
			this.props.close();
		};

		if ((this.config.mode == I.NetworkMode.Local) && (this.config.userPath !== userPath)) {
			popupStore.open('confirm', {
				className: 'isWide',
				data: {
					title: translate('popupSettingsOnboardingLocalOnlyWarningTitle'),
					text: translate('popupSettingsOnboardingLocalOnlyWarningText'),
					onConfirm: callBack,
					textConfirm: translate('popupSettingsOnboardingLocalOnlyWarningConfirm'),
				},
			});
		} else {
			callBack();
		};
	};

	onPathClick (path: string) {
		if (path) {
			Renderer.send('pathOpen', UtilCommon.getElectron().dirname(path));
		};
	};

	onChangeStorage () {
		Action.openDir({}, (paths: string[]) => {
			this.onChange('userPath', paths[0]);
		});
	};

	onTooltipShow (e: any, text: string) {
		Preview.tooltipShow({ text, element: $(e.currentTarget) });
	};

	onTooltipHide () {
		Preview.tooltipHide();
	};

});

export default PopupSettingsOnboarding;
