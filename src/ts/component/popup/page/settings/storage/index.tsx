import * as React from 'react';
import { Title, Label, IconObject, ObjectName, Button } from 'Component';
import { analytics, C, DataUtil, FileUtil, I, translate, Util } from 'Lib';
import { observer } from 'mobx-react';
import { commonStore, detailStore, popupStore } from 'Store';
import Constant from "json/constant.json";

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
        const space = detailStore.get(Constant.subId.space, commonStore.workspace);
        const storageUsage = DataUtil.getStorageUsage();
        const usageCn = [ 'type' ];

        if (storageUsage.isFull) {
            usageCn.push('red');
        };

        return (
            <React.Fragment>
                <Title text={translate('popupSettingsStorageIndexTitle')} />
                <Title className="sub" text={translate('popupSettingsStorageIndexRemoteStorage')} />
                <Label className="description" text={Util.sprintf(translate(`popupSettingsStorageIndexText`), storageUsage.of)} />

                <div className="storageUsage">
                    <div className="space">
                        <IconObject object={space} forceLetter={true} size={44} />
                        <div className="txt">
                            <ObjectName object={space} />
                            <div className={usageCn.join(' ')}>{Util.sprintf(translate(`popupSettingsStorageIndexUsage`), storageUsage.used, storageUsage.of)}</div>
                        </div>
                    </div>
                    <Button className="c28 blank" text={translate('popupSettingsStorageIndexManageFiles')} onClick={this.onManageFiles} />
                </div>

                <div className="progressBar"><div className="progressBarFill" style={{ width: storageUsage.percentageUsed + '%' }} /></div>

                <Title className="sub" text={translate('popupSettingsStorageIndexLocalStorageTitle')} />
                <Label className="description" text={translate('popupSettingsStorageIndexLocalStorageText')} />

                <div className="storageUsage">
                    <div className="space">
                        <IconObject className="localStorageIcon" object={{ iconEmoji: ':desktop_computer:' }} size={44} />
                        <div className="txt">
                            <ObjectName object={space} />
                            <div className="type">{Util.sprintf(translate(`popupSettingsStorageIndexLocalStorageUsage`), storageUsage.localUsed)}</div>
                        </div>
                    </div>
                    <Button className="c28 blank" text={translate('popupSettingsStorageIndexOffloadFiles')} onClick={this.onFileOffload} />
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
                text: 'All media files will be deleted from your current device. They can be downloaded again from a backup node or another device.',
                textConfirm: 'Yes',
                onConfirm: () => {
                    setLoading(true);

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

});

export default PopupSettingsPageStorageIndex;
