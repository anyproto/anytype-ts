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

const PopupSettingsPageStorageIndex = observer(class PopupSettingsPageStorageIndex extends React.Component<Props, {}> {

    constructor (props: Props) {
        super(props);

        this.onManage = this.onManage.bind(this);
        this.onOffload = this.onOffload.bind(this);
		this.onExtend = this.onExtend.bind(this);
    };

    render () {
        const { bytesUsed, bytesLimit, localUsage } = commonStore.spaceStorage;
        const percentageUsed = Math.floor(UtilCommon.getPercent(bytesUsed, bytesLimit));
        const isRed = percentageUsed >= 90;
        const space = UtilObject.getSpace();
        const usageCn = [ 'type' ];
        const localStorage = { name: 'Local files', iconEmoji: ':desktop_computer:' };

        let extend = null;
        if (isRed) {
            usageCn.push('red');
            extend = <Label text="Get more space." onClick={this.onExtend} className="extend" />;
        };

        return (
            <React.Fragment>
                <Title text={translate('popupSettingsStorageIndexTitle')} />
                <Title className="sub" text={translate('popupSettingsStorageIndexRemoteStorage')} />
                <div className="description">
                    <Label text={UtilCommon.sprintf(translate(`popupSettingsStorageIndexText`), UtilFile.size(bytesLimit))} />
                    &nbsp;
                    {extend}
                </div>


                <div className="storageUsage">
                    <div className="space">
                        <IconObject object={space} forceLetter={true} size={44} />
                        <div className="txt">
                            <ObjectName object={space} />
                            <div className={usageCn.join(' ')}>{UtilCommon.sprintf(translate(`popupSettingsStorageIndexUsage`), UtilFile.size(bytesUsed), UtilFile.size(bytesLimit))}</div>
                        </div>
                    </div>
                    <Button color="blank" className="c28" text={translate('popupSettingsStorageIndexManageFiles')} onClick={this.onManage} />
                </div>

                <ProgressBar percent={percentageUsed} />

                <Title className="sub" text={translate('popupSettingsStorageIndexLocalStorageTitle')} />
                <Label className="description" text={translate('popupSettingsStorageIndexLocalStorageText')} />

                <div className="storageUsage">
                    <div className="space">
                        <IconObject object={localStorage} size={44} />
                        <div className="txt">
                            <ObjectName object={localStorage} />
                            <div className="type">{UtilCommon.sprintf(translate(`popupSettingsStorageIndexLocalStorageUsage`), UtilFile.size(localUsage))}</div>
                        </div>
                    </div>
                    <Button color="blank" className="c28" text={translate('popupSettingsStorageIndexOffloadFiles')} onClick={this.onOffload} />
                </div>

            </React.Fragment>
        );
    };

    onManage () {
        const { onPage } = this.props;

        onPage('storageManager');
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

    onExtend () {
        const { account } = authStore;
        const space = UtilObject.getSpace();

        if (!account || space._empty_) {
            return;
        };

        let url = Url.extendStorage;

        url = url.replace(/\%25accountId\%25/g, account.id);
        url = url.replace(/\%25spaceName\%25/g, space.name);

        Renderer.send('urlOpen', url);
    };

});

export default PopupSettingsPageStorageIndex;
