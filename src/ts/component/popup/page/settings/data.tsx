import * as React from 'react';
import { Title, Label, IconObject, ObjectName, Button } from 'Component';
import { analytics, C, UtilRouter, UtilFile, I, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';
import { authStore, commonStore, popupStore } from 'Store';

interface Props extends I.PopupSettings {
    onPage: (id: string) => void;
    setLoading: (v: boolean) => void;
};

const PopupSettingsPageDataManagement = observer(class PopupSettingsPageStorageIndex extends React.Component<Props, {}> {

    constructor (props: Props) {
        super(props);

        this.onOffload = this.onOffload.bind(this);
        this.onLocationMove = this.onLocationMove.bind(this);
    };

    render () {
        const { onPage } = this.props;
        const { localUsage } = commonStore.spaceStorage;
        const { walletPath, accountPath } = authStore;
        const { config } = commonStore;
        const localStorage = { name: translate('popupSettingsDataLocalFiles'), iconEmoji: ':desktop_computer:' };
        const canMove = config.experimental;

        return (
            <React.Fragment>
                <Title text={translate('popupSettingsDataManagementTitle')} />
                <Label className="description" text={translate('popupSettingsDataManagementLocalStorageText')} />

                <div className="actionItems">
                    <div className="item storageUsage">
                        <div className="side left">
                            <IconObject object={localStorage} size={44} />

                            <div className="txt">
                                <ObjectName object={localStorage} />
                                <div className="type">{UtilCommon.sprintf(translate(`popupSettingsDataManagementLocalStorageUsage`), UtilFile.size(localUsage))}</div>
                            </div>
                        </div>
						<div className="side right">
							<Button color="blank" className="c28" text={translate('popupSettingsDataManagementOffloadFiles')} onClick={this.onOffload} />
						</div>
                    </div>

                    {canMove ? (
                        <div id="row-location" className="item accountLocation" onClick={this.onLocationMove}>
                            <Label text={translate('popupSettingsAccountMoveTitle')} />
                            <Label className="locationLabel" text={walletPath == accountPath ? 'Default' : 'Custom'} />
                        </div>
                    ) : ''}
                </div>

                <Title className="sub" text={translate('popupSettingsDataManagementDeleteTitle')} />
                <Label className="description" text={translate('popupSettingsDataManagementDeleteText')} />
                <Button className="c36" onClick={() => onPage('delete')} color="red" text={translate('popupSettingsDataManagementDeleteButton')} />

            </React.Fragment>
        );
    };

    onOffload (e: any) {
        const { setLoading } = this.props;

        analytics.event('ScreenFileOffloadWarning');

        popupStore.open('confirm',{
            data: {
                title: translate('popupSettingsDataOffloadWarningTitle'),
                text: translate('popupSettingsDataOffloadWarningText'),
                textConfirm: translate('commonYes'),
                onConfirm: () => {
                    setLoading(true);
                    analytics.event('SettingsStorageOffload');

                    C.FileListOffload([], false, (message: any) => {
                        setLoading(false);

                        if (message.error.code) {
                            return;
                        };

                        popupStore.open('confirm',{
                            data: {
                                title: translate('popupSettingsDataFilesOffloaded'),
                                //text: UtilCommon.sprintf('Files: %s, Size: %s', message.files, UtilFile.size(message.bytes)),
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

    onLocationMove () {
        const { setLoading } = this.props;
		const { account } = authStore;
		const { info } = account;
		const localStoragePath = String(info.localStoragePath || '');

		if (!localStoragePath) {
			return;
		};

        const accountPath = localStoragePath.replace(new RegExp(account.id + '\/?$'), '');
        const options = {
            defaultPath: accountPath,
            properties: [ 'openDirectory' ],
        };

        UtilCommon.getElectron().showOpenDialog(options).then((result: any) => {
            const files = result.filePaths;
            if ((files == undefined) || !files.length) {
                return;
            };

            setLoading(true);
            C.AccountMove(files[0], (message: any) => {
                if (message.error.code) {
                    this.setState({ error: message.error.description });
                } else {
                    UtilRouter.go('/auth/setup/init', {});
                };
                setLoading(false);
            });
        });
    };

});

export default PopupSettingsPageDataManagement;
