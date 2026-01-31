import React, { forwardRef } from 'react';
import { Title, Label, Button, Icon, Switch } from 'Component';
import { I, C, S, U, translate, analytics, Action } from 'Lib';
import { observer } from 'mobx-react';

const PageMainSettingsDataIndex = observer(forwardRef<I.PageRef, I.PageSettingsComponent>((props, ref) => {

	const { dataPath, spaceStorage, autoDownload } = S.Common;
	const { localUsage } = spaceStorage;
	const isLocalNetwork = U.Data.isLocalNetwork();
	const suffix = isLocalNetwork ? 'LocalOnly' : '';

	const onOffload = (e: any) => {
		analytics.event('ScreenFileOffloadWarning');

		S.Popup.open('confirm',{
			data: {
				title: translate('commonAreYouSure'),
				text: translate(`popupSettingsDataOffloadWarningText${suffix}`),
				textConfirm: isLocalNetwork ? translate('popupSettingsDataRemoveFiles') : translate('commonConfirm'),
				textCancel: isLocalNetwork ? translate('popupSettingsDataKeepFiles') : translate('commonCancel'),
				onConfirm: () => {
					analytics.event('SettingsStorageOffload');

					C.FileListOffload([], false, (message: any) => {
						if (message.error.code) {
							return;
						};

						S.Popup.open('confirm',{
							data: {
								title: translate('popupSettingsDataFilesOffloaded'),
								textConfirm: translate('commonOk'),
								canCancel: false,
							}
						});

						analytics.event('FileOffload', { middleTime: message.middleTime });
					});
				},
			},
		});
	};

	const onOpenDataLocation = () => {
		Action.openPath(dataPath);
		analytics.event('ClickSettingsDataManagementLocation', { route: analytics.route.settings });
	};

	return (
		<>
			<Title text={translate('popupSettingsLocalStorageTitle')} />
			<Label className="description" text={translate(`popupSettingsDataManagementLocalStorageText${suffix}`)} />

			<div className="actionItems">

				<div className="item storageUsage">
					<div className="side left">
						<Icon className="drive" />

						<div className="txt">
							<div className="name">{translate('popupSettingsDataLocalFiles')}</div>
							<div className="type">{U.String.sprintf(translate(`popupSettingsDataManagementLocalStorageUsage`), U.File.size(localUsage))}</div>
						</div>
					</div>
					<div className="side right">
						<Button color="blank" className="c28" text={translate(`popupSettingsDataManagementOffloadFiles${suffix}`)} onClick={onOffload} />
					</div>
				</div>

				<div className="item">
					<div className="side left">
						<Icon className="offline" />

						<div className="txt">
							<Title text={translate('popupSettingsDataOfflineAccess')} />
							<Label text={translate('popupSettingsDataOfflineAccessDescription')} />
						</div>
					</div>
					<div className="side right">
						<Switch
							className="big"
							value={autoDownload}
							onChange={(e: any, v: boolean) => {
								S.Common.autoDownloadSet(v);
								C.FileSetAutoDownload(v, false);
							}}
						/>
					</div>
				</div>

				<div className="item">
					<div className="side left">
						<Icon className="location" />

						<div className="txt">
							<Title text={translate('popupSettingsDataManagementDataLocation')} />
							<Label text={dataPath} />
						</div>
					</div>
					<div className="side right">
						<Button color="blank" className="c28" text={translate(`commonOpen`)} onClick={onOpenDataLocation} />
					</div>
				</div>
			</div>
		</>
	);

}));

export default PageMainSettingsDataIndex;