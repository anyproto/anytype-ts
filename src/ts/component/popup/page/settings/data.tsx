import * as React from 'react';
import { Title, Label, IconObject, ObjectName, Button, ProgressBar } from 'Component';
import { analytics, C, UtilObject, UtilFile, I, translate, UtilCommon, Renderer } from 'Lib';
import { observer } from 'mobx-react';
import { authStore, commonStore, detailStore, popupStore } from 'Store';
import Constant from 'json/constant.json';
import Url from 'json/url.json';

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

        const localStorage = { name: 'Local files', iconEmoji: ':desktop_computer:' };
        const canMove = config.experimental;

        return (
            <React.Fragment>
                <Title text={translate('popupSettingsDataManagementTitle')} />
                <Label className="description" text={translate('popupSettingsDataManagementLocalStorageText')} />

                <div className="actionItems">
                    <div className="item storageUsage">
                        <div className="space">
                            <IconObject object={localStorage} size={44} />
                            <div className="txt">
                                <ObjectName object={localStorage} />
                                <div className="type">{UtilCommon.sprintf(translate(`popupSettingsDataManagementLocalStorageUsage`), UtilFile.size(localUsage))}</div>
                            </div>
                        </div>
                        <Button color="blank" className="c28" text={translate('popupSettingsDataManagementOffloadFiles')} onClick={this.onOffload} />
                    </div>

                    {canMove ? (
                        <div id="row-location" className="item cp" onClick={this.onLocationMove}>
                            <Label text={translate('popupSettingsAccountMoveTitle')} />
                            <div className="select">
                                <div className="item">
                                    <div className="name">{walletPath == accountPath ? 'Default' : 'Custom'}</div>
                                </div>
                            </div>
                        </div>
                    ) : ''}
                </div>

                <Title className="sub" text={translate('popupSettingsDataManagementDeleteTitle')} />
                <Label className="description" text={translate('popupSettingsDataManagementDeleteText')} />
                <Button onClick={() => { onPage('delete'); }} className="red blank" text={translate('popupSettingsDataManagementDeleteButton')} />

            </React.Fragment>
        );
    };

    onOffload (e: any) {
        const { setLoading } = this.props;

        analytics.event('ScreenFileOffloadWarning');

        popupStore.open('confirm',{
            data: {
                title: 'Are you sure?',
                text: 'All media files stored <b>in Anytype</b> will be deleted from your current device. They can be downloaded again from a backup node or another device.',
                textConfirm: 'Yes',
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
                                title: 'Files offloaded',
                                //text: UtilCommon.sprintf('Files: %s, Size: %s', message.files, UtilFile.size(message.bytes)),
                                textConfirm: 'Ok',
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
        const { account } = authStore;
        const { setLoading } = this.props;
        const accountPath = account.info.localStoragePath.replace(new RegExp(account.id + '\/?$'), '');
        const options = {
            defaultPath: accountPath,
            properties: [ 'openDirectory' ],
        };

        window.Electron.showOpenDialog(options).then((result: any) => {
            const files = result.filePaths;
            if ((files == undefined) || !files.length) {
                return;
            };

            setLoading(true);
            C.AccountMove(files[0], (message: any) => {
                if (message.error.code) {
                    this.setState({ error: message.error.description });
                } else {
                    UtilCommon.route('/auth/setup/init', {});
                };
                setLoading(false);
            });
        });
    };

});

export default PopupSettingsPageDataManagement;
