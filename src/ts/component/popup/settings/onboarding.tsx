import * as React from 'react';
import { Title, Label, Select, Button, Error } from 'Component';
import { I, S, U, translate, Action, analytics, Renderer, Preview } from 'Lib';
import { observer } from 'mobx-react';

interface State {
	error: string;
};

const PopupSettingsOnboarding = observer(class PopupSettingsOnboarding extends React.Component<I.Popup> {

	config: any = {};
	state = {
		error: '',
	};
	refMode = null;

	constructor (props: I.Popup) {
		super(props);

		const { networkConfig } = S.Auth;
		const { mode, path } = networkConfig;
		const userPath = U.Common.getElectron().userPath();

		this.config = {
			userPath,
			mode,
			path: path || '',
		};

		this.onUpload = this.onUpload.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onPathClick = this.onPathClick.bind(this);
		this.onChangeStorage = this.onChangeStorage.bind(this);
		this.onResetStorage = this.onResetStorage.bind(this);
		this.onConfirmStorage = this.onConfirmStorage.bind(this);
		this.onTooltipShow = this.onTooltipShow.bind(this);
		this.onTooltipHide = this.onTooltipHide.bind(this);
	};

	render () {
		const { error } = this.state;
		const { mode, path, userPath } = this.config;
		const { interfaceLang } = S.Common;
		const interfaceLanguages = U.Menu.getInterfaceLanguages();
		const isDefault = path == U.Common.getElectron().defaultPath();
		const networkModes = this.getNetworkModes();

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
									className: 'fixed withFullDescripion',
									data: { noVirtualisation: true, noScroll: true }
								}}
							/>
						</div>

						{mode == I.NetworkMode.Custom ? (
							<div className="item" onMouseEnter={e => this.onTooltipShow(e, path)} onMouseLeave={this.onTooltipHide}>
								<div onClick={() => this.onPathClick(path)}>
									<Label text={translate('popupSettingsOnboardingNetworkTitle')} />
									{path ? <Label className="small" text={U.Common.shorten(path, 32)} /> : ''}
								</div>
								<Button className="c28" text={translate('commonLoad')} onClick={this.onUpload} />
							</div>
						) : ''}

						<div className="item" onMouseEnter={e => this.onTooltipShow(e, userPath)} onMouseLeave={this.onTooltipHide}>
							<div onClick={() => this.onPathClick(userPath)}>
								<Label text={translate('popupSettingsOnboardingStoragePath')} />
								<Label className="small" text={U.Common.shorten(userPath, 32)} />
							</div>
							<div className="buttons">
								<Button className="c28" text={translate('commonChange')} onClick={this.onChangeStorage} />
								{!isDefault ? <Button className="c28" text={translate('commonReset')} onClick={this.onResetStorage} /> : ''}
							</div>
						</div>
					</div>

					<div className="buttons">
						<Button text={translate('commonSave')} onClick={this.onSave} />
					</div>

					<Error text={error} />
				</div>
			</div>
		);
	};

	getNetworkModes () {
		return ([
			{ id: I.NetworkMode.Default },
			{ id: I.NetworkMode.Local },
			{ id: I.NetworkMode.Custom },
		] as any[]).map(it => {
			it.name = translate(`networkMode${it.id}Title`);
			it.description = translate(`networkMode${it.id}Text`);
			it.withDescription = true;

			if (it.id == I.NetworkMode.Local) {
				it.note = translate('popupSettingsOnboardingLocalOnlyNote');
			};

			return it;
		});
	};

	onChange (key: string, value: any) {
		this.config[key] = value;
		this.forceUpdate();
	};

	onUpload () {
		Action.openFileDialog({ extensions: [ 'yml', 'yaml' ] }, (paths: string[]) => {
			Renderer.send('moveNetworkConfig', paths[0]).then(res => {
				if (res.path) {
					this.onChange('path', res.path);
				} else 
				if (res.error) {
					this.setState({ error: res.error });
				};
			});
		});
	};

	onSave () {
		const { networkConfig } = S.Auth;
		const userPath = U.Common.getElectron().userPath();

		const save = () => {
			if (this.config.mode !== networkConfig.mode) {
				analytics.event('SelectNetwork', { route: analytics.route.onboarding, type: this.config.mode });
			};

			if (this.config.path !== networkConfig.path) {
				analytics.event('UploadNetworkConfiguration', { route: analytics.route.onboarding });
			};

			if (this.config.userPath !== userPath) {
				Renderer.send('setUserDataPath', this.config.userPath);
				S.Common.dataPathSet(this.config.userPath);
				delete this.config.userPath;
			};

			S.Auth.networkConfigSet(this.config);
			window.setTimeout(() => this.props.close(), S.Popup.getTimeout());
		};

		if (this.config.mode == I.NetworkMode.Local) {
			S.Popup.open('confirm', {
				className: 'localOnlyWarning',
				data: {
					icon: 'warning',
					title: translate('commonAreYouSure'),
					text: translate('popupSettingsOnboardingLocalOnlyConfirmText'),
					textConfirm: translate('popupSettingsOnboardingLocalOnlyConfirmConfirm'),
					textCancel: translate('popupSettingsOnboardingLocalOnlyConfirmCancel'),
					colorConfirm: 'blank',
					colorCancel: 'blank',
					onConfirm: save,
					onCancel: () => {
						this.config.mode = I.NetworkMode.Default;
						this.refMode?.setValue(I.NetworkMode.Default);
						this.forceUpdate();
					}
				}
			});
		} else {
			save();
		};
	};

	onPathClick (path: string) {
		if (path) {
			Action.openPath(U.Common.getElectron().dirName(path));
		};
	};

	onChangeStorage () {
		const onConfirm = () => {
			Action.openDirectoryDialog({}, (paths: string[]) => {
				this.onChange('userPath', paths[0]);

				analytics.event('ChangeStorageLocation', { type: 'Change', route: analytics.route.onboarding });
			});
		};

		if (this.config.mode == I.NetworkMode.Local) {
			this.onConfirmStorage(onConfirm);
		} else {
			onConfirm();
		};
	};

	onResetStorage () {
		const onConfirm = () => {
			this.onChange('userPath', U.Common.getElectron().defaultPath());

			analytics.event('ChangeStorageLocation', { type: 'Reset', route: analytics.route.onboarding });
		};

		if (this.config.mode == I.NetworkMode.Local) {
			this.onConfirmStorage(onConfirm);
		} else {
			onConfirm();
		};
	};

	onConfirmStorage (onConfirm: () => void) {
		S.Popup.open('confirm', {
			data: {
				title: translate('commonAreYouSure'),
				text: translate('popupSettingsOnboardingLocalOnlyWarningText'),
				textConfirm: translate('popupSettingsOnboardingLocalOnlyWarningConfirm'),
				onConfirm,
			},
		});
	};

	onTooltipShow (e: any, text: string) {
		if (text) {
			Preview.tooltipShow({ text, element: $(e.currentTarget) });
		};
	};

	onTooltipHide () {
		Preview.tooltipHide();
	};

});

export default PopupSettingsOnboarding;
