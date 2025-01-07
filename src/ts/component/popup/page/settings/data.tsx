import * as React from 'react';
import { Title, Label, IconObject, Button } from 'Component';
import { I, C, S, U, translate, Renderer, analytics } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.PopupSettings {
	onPage: (id: string) => void;
	setLoading: (v: boolean) => void;
};

const PopupSettingsPageDataManagement = observer(class PopupSettingsPageStorageIndex extends React.Component<Props, {}> {

	constructor (props: Props) {
		super(props);

		this.onOffload = this.onOffload.bind(this);
	};

	render () {
		const { onPage } = this.props;
		const { dataPath, spaceStorage } = S.Common;
		const { localUsage } = spaceStorage;
		const suffix = this.getSuffix();

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsDataManagementTitle')} />
				<Label className="description" text={translate(`popupSettingsDataManagementLocalStorageText${suffix}`)} />

				<div className="actionItems">
					<div className="item storageUsage">
						<div className="side left">
							<IconObject object={{ iconEmoji: ':desktop_computer:' }} size={44} />

							<div className="txt">
								<div className="name">{translate('popupSettingsDataLocalFiles')}</div>
								<div className="type">{U.Common.sprintf(translate(`popupSettingsDataManagementLocalStorageUsage`), U.File.size(localUsage))}</div>
							</div>
						</div>
						<div className="side right">
							<Button color="blank" className="c28" text={translate(`popupSettingsDataManagementOffloadFiles${suffix}`)} onClick={this.onOffload} />
						</div>
					</div>


					<div className="item">
						<div className="side left">
							<IconObject object={{ iconEmoji: ':file_folder:' }} size={44} />

							<div className="txt">
								<Title text={translate('popupSettingsDataManagementDataLocation')} />
								<Label text={dataPath} />
							</div>
						</div>
						<div className="side right">
							<Button color="blank" className="c28" text={translate(`commonOpen`)} onClick={this.onOpenDataLocation} />
						</div>
					</div>
				</div>

				<Title className="sub" text={translate('popupSettingsDataManagementDeleteTitle')} />
				<Label className="description" text={translate('popupSettingsDataManagementDeleteText')} />
				<Button className="c36" onClick={() => onPage('delete')} color="red" text={translate('popupSettingsDataManagementDeleteButton')} />
			</React.Fragment>
		);
	};

	onOffload (e: any) {
		const { setLoading } = this.props;
		const suffix = this.getSuffix();
		const isLocalNetwork = U.Data.isLocalNetwork();

		analytics.event('ScreenFileOffloadWarning');

		S.Popup.open('confirm',{
			data: {
				title: translate('commonAreYouSure'),
				text: translate(`popupSettingsDataOffloadWarningText${suffix}`),
				textConfirm: isLocalNetwork ? translate('popupSettingsDataKeepFiles') : translate('commonYes'),
				canCancel: isLocalNetwork,
				textCancel: translate('popupSettingsDataRemoveFiles'),
				onConfirm: () => {
					setLoading(true);
					analytics.event('SettingsStorageOffload');

					C.FileListOffload([], false, (message: any) => {
						setLoading(false);

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
			}
		});
	};

	onOpenDataLocation () {
		Renderer.send('openPath', S.Common.dataPath);
		analytics.event('ClickSettingsDataManagementLocation', { route: analytics.route.settings });
	};

	getSuffix () {
		return U.Data.isLocalNetwork() ? 'LocalOnly' : '';
	};

});

export default PopupSettingsPageDataManagement;
