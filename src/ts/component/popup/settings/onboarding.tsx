import React, { forwardRef, useRef, useState } from 'react';
import { Title, Label, Select, Button, Error } from 'Component';
import { I, S, U, translate, Action, analytics, Renderer, Preview } from 'Lib';
import { observer } from 'mobx-react';

const PopupSettingsOnboarding = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { close } = props;
	const { networkConfig } = S.Auth;
	const { mode, path } = networkConfig;
	const userPath = U.Common.getElectron().userPath();
	const [ config, setConfig ] = useState({
		userPath,
		mode,
		path: path || '',
	});
	const [ error, setError ] = useState('');
	const refMode = useRef(null);

	const getNetworkModes = () => {
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

	const onChange = (key: string, value: any) => {
		setConfig(prev => ({ ...prev, [ key ]: value }));
	};

	const onUpload = () => {
		Action.openFileDialog({ extensions: [ 'yml', 'yaml' ] }, (paths: string[]) => {
			Renderer.send('moveNetworkConfig', paths[0]).then(res => {
				if (res.path) {
					onChange('path', res.path);
				} else 
				if (res.error) {
					setError(res.error);
				};
			});
		});
	};

	const onPathClick = (path: string) => {
		if (path) {
			Action.openPath(U.Common.getElectron().dirName(path));
		};
	};

	const onConfirmStorage = (onConfirm: () => void) => {
		S.Popup.open('confirm', {
			data: {
				title: translate('commonAreYouSure'),
				text: translate('popupSettingsOnboardingLocalOnlyWarningText'),
				textConfirm: translate('popupSettingsOnboardingLocalOnlyWarningConfirm'),
				onConfirm,
			},
		});
	};

	const onChangeStorage = () => {
		const onConfirm = () => {
			Action.openDirectoryDialog({}, (paths: string[]) => {
				onChange('userPath', paths[0]);

				analytics.event('ChangeStorageLocation', { type: 'Change', route: analytics.route.onboarding });
			});
		};

		if (config.mode == I.NetworkMode.Local) {
			onConfirmStorage(onConfirm);
		} else {
			onConfirm();
		};
	};

	const onResetStorage = () => {
		const onConfirm = () => {
			onChange('userPath', U.Common.getElectron().defaultPath());

			analytics.event('ChangeStorageLocation', { type: 'Reset', route: analytics.route.onboarding });
		};

		if (config.mode == I.NetworkMode.Local) {
			onConfirmStorage(onConfirm);
		} else {
			onConfirm();
		};
	};

	const onSave = () => {
		const { networkConfig } = S.Auth;
		const userPath = U.Common.getElectron().userPath();

		const save = () => {
			if (config.mode !== networkConfig.mode) {
				analytics.event('SelectNetwork', { route: analytics.route.onboarding, type: config.mode });
			};

			if (config.path !== networkConfig.path) {
				analytics.event('UploadNetworkConfiguration', { route: analytics.route.onboarding });
			};

			if (config.userPath !== userPath) {
				Renderer.send('setUserDataPath', config.userPath);
				S.Common.dataPathSet(config.userPath);
			};

			const configToSave = { ...config };
			delete configToSave.userPath;

			S.Auth.networkConfigSet(configToSave);
			window.setTimeout(() => close(), S.Popup.getTimeout());
		};

		if (config.mode == I.NetworkMode.Local) {
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
						onChange('mode', I.NetworkMode.Default);
						refMode.current?.setValue(I.NetworkMode.Default);
					}
				}
			});
		} else {
			save();
		};
	};

	const onTooltipShow = (e: any, text: string) => {
		if (text) {
			Preview.tooltipShow({ text, element: $(e.currentTarget) });
		};
	};

	const onTooltipHide = () => {
		Preview.tooltipHide();
	};

	const { interfaceLang } = S.Common;
	const interfaceLanguages = U.Menu.getInterfaceLanguages();
	const isDefault = config.path == U.Common.getElectron().defaultPath();
	const networkModes = getNetworkModes();

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
							ref={refMode}
							value={String(config.mode || '')}
							options={networkModes}
							onChange={v => onChange('mode', v)}
							arrowClassName="black"
							menuParam={{ 
								horizontal: I.MenuDirection.Right, 
								width: 300,
								className: 'fixed withFullDescripion',
								data: { noVirtualisation: true, noScroll: true }
							}}
						/>
					</div>

					{config.mode == I.NetworkMode.Custom ? (
						<div className="item" onMouseEnter={e => onTooltipShow(e, config.path)} onMouseLeave={onTooltipHide}>
							<div onClick={() => onPathClick(config.path)}>
								<Label text={translate('popupSettingsOnboardingNetworkTitle')} />
								{config.path ? <Label className="small" text={U.Common.shorten(config.path, 32)} /> : ''}
							</div>
							<Button className="c28" text={translate('commonLoad')} onClick={onUpload} />
						</div>
					) : ''}

					<div className="item" onMouseEnter={e => onTooltipShow(e, config.userPath)} onMouseLeave={onTooltipHide}>
						<div onClick={() => onPathClick(config.userPath)}>
							<Label text={translate('popupSettingsOnboardingStoragePath')} />
							<Label className="small" text={U.Common.shorten(config.userPath, 32)} />
						</div>
						<div className="buttons">
							<Button className="c28" text={translate('commonChange')} onClick={onChangeStorage} />
							{!isDefault ? <Button className="c28" text={translate('commonReset')} onClick={onResetStorage} /> : ''}
						</div>
					</div>
				</div>

				<div className="buttons">
					<Button text={translate('commonSave')} onClick={onSave} />
				</div>

				<Error text={error} />
			</div>
		</div>
	);

}));

export default PopupSettingsOnboarding;