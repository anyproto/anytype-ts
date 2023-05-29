import * as React from 'react';
import { Title, Label, IconObject, ObjectName, Button, ProgressBar } from 'Component';
import { analytics, C, DataUtil, FileUtil, Storage, I, translate, Util, Renderer } from 'Lib';
import { observer } from 'mobx-react';
import { authStore, commonStore, detailStore, popupStore } from 'Store';
import Constant from 'json/constant.json';
import Url from 'json/url.json';

interface Props extends I.PopupSettings {
    onPage: (id: string) => void;
    setLoading: (v: boolean) => void;
};

const PopupSettingsPageStorageIndex = observer(class PopupSettingsPageStorageIndex extends React.Component<Props, {}> {

    constructor (props: Props) {
        super(props);

        this.onManageFiles = this.onManageFiles.bind(this);
        this.onFileOffload = this.onFileOffload.bind(this);
    };

    render () {
        const { bytesUsed, bytesLimit, localUsage } = commonStore.spaceStorage;
        const percentageUsed = Math.floor(Util.getPercent(bytesUsed, bytesLimit));
        const isRed = percentageUsed >= 90;

        const space = detailStore.get(Constant.subId.space, commonStore.workspace);
        const usageCn = [ 'type' ];
        const localStorage = { name: 'Local files', iconEmoji: ':desktop_computer:' };

        let extendStorageButton = null;

        if (isRed) {
            usageCn.push('red');
            extendStorageButton = <div onClick={this.onExtendStorageUrl} className="extendStorageButton">Get more space.</div>;
        };

        return (
            <React.Fragment>
                <Title text={translate('popupSettingsStorageIndexTitle')} />
                <Title className="sub" text={translate('popupSettingsStorageIndexRemoteStorage')} />
                <div className="description">
                    <Label text={Util.sprintf(translate(`popupSettingsStorageIndexText`), FileUtil.size(bytesLimit))} />
                    &nbsp;
                    {extendStorageButton}
                </div>


                <div className="storageUsage">
                    <div className="space">
                        <IconObject object={space} forceLetter={true} size={44} />
                        <div className="txt">
                            <ObjectName object={space} />
                            <div className={usageCn.join(' ')}>{Util.sprintf(translate(`popupSettingsStorageIndexUsage`), FileUtil.size(bytesUsed), FileUtil.size(bytesLimit))}</div>
                        </div>
                    </div>
                    <Button color="blank" className="c28" text={translate('popupSettingsStorageIndexManageFiles')} onClick={this.onManageFiles} />
                </div>

                <ProgressBar percent={percentageUsed} />

                <Title className="sub" text={translate('popupSettingsStorageIndexLocalStorageTitle')} />
                <Label className="description" text={translate('popupSettingsStorageIndexLocalStorageText')} />

                <div className="storageUsage">
                    <div className="space">
                        <IconObject object={localStorage} size={44} />
                        <div className="txt">
                            <ObjectName object={localStorage} />
                            <div className="type">{Util.sprintf(translate(`popupSettingsStorageIndexLocalStorageUsage`), FileUtil.size(localUsage))}</div>
                        </div>
                    </div>
                    <Button color="blank" className="c28" text={translate('popupSettingsStorageIndexOffloadFiles')} onClick={this.onFileOffload} />
                </div>

            </React.Fragment>
        );
    };

    onManageFiles () {
        const { onPage } = this.props;

        onPage('storageManager');
    };

    onFileOffload (e: any) {
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
                                //text: Util.sprintf('Files: %s, Size: %s', message.files, FileUtil.size(message.bytes)),
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

    onExtendStorageUrl () {
        const { account } = authStore;
        const space = detailStore.get(Constant.subId.space, commonStore.workspace);

        if (!account || !space) {
            return;
        };

        let url = Url.extendStorage;

        url = url.replace(/\%25accountId\%25/g, account.id);
        url = url.replace(/\%25spaceName\%25/g, space.name);

        Renderer.send('urlOpen', url);
    };

});

export default PopupSettingsPageStorageIndex;
