import * as React from 'react';
import { Title, Label, IconObject, Button } from 'Component';
import { I, C, S, U, translate, analytics, Action } from 'Lib';
import { observer } from 'mobx-react';

interface State {
	list: I.PublishState[];
};

interface Props extends I.PopupSettings {
	onPage: (id: string) => void;
	setLoading: (v: boolean) => void;
};

const PopupSettingsPageDataIndex = observer(class PopupSettingsPageDataIndex extends React.Component<Props, State> {

	state = {
		list: [],
	};

	constructor (props: Props) {
		super(props);

		this.onOffload = this.onOffload.bind(this);
	};

	render () {
		const { onPage } = this.props;
		const { list } = this.state;
		const { dataPath, spaceStorage } = S.Common;
		const { localUsage } = spaceStorage;
		const suffix = this.getSuffix();
		const size = U.File.size(list.reduce((acc, item) => acc + item.size, 0));

		return (
			<>
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
							<IconObject object={{ iconEmoji: ':earth_americas:' }} size={44} />

							<div className="txt">
								<Title text={translate('popupSettingsDataManagementDataPublishTitle')} />
								<Label text={size} />
							</div>
						</div>
						<div className="side right">
							<Button color="blank" className="c28" text={translate(`commonManage`)} onClick={() => onPage('dataPublish')} />
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
			</>
		);
	};

	componentDidMount(): void {
		C.PublishingList('', (message: any) => {
			if (!message.error.code) {
				this.setState({ list: message.list });
			};
		});
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
		Action.openPath(S.Common.dataPath);
		analytics.event('ClickSettingsDataManagementLocation', { route: analytics.route.settings });
	};

	getSuffix () {
		return U.Data.isLocalNetwork() ? 'LocalOnly' : '';
	};

});

export default PopupSettingsPageDataIndex;
