import * as React from 'react';
import { Title, Label, IconObject, ObjectName, Button } from 'Component';
import { analytics, C, UtilFile, I, translate, UtilCommon, UtilData } from 'Lib';
import { observer } from 'mobx-react';
import { commonStore, popupStore } from 'Store';

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
        const { localUsage } = commonStore.spaceStorage;
        const localStorage = { name: translate('popupSettingsDataLocalFiles'), iconEmoji: ':desktop_computer:' };

        return (
            <React.Fragment>
                <Title text={translate('popupSettingsDataManagementTitle')} />
                <Label className="description" text={translate(`popupSettingsDataManagementLocalStorageText${suffix}`)} />

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
							<Button color="blank" className="c28" text={translate(`popupSettingsDataManagementOffloadFiles${suffix}`)} onClick={this.onOffload} />
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
		const localOnly =  UtilData.isLocalOnly();

        analytics.event('ScreenFileOffloadWarning');

        popupStore.open('confirm',{
            data: {
                title: translate('popupSettingsDataOffloadWarningTitle'),
                text: translate(`popupSettingsDataOffloadWarningText${localOnly ? 'LocalOnly' : ''}`),
                textConfirm: localOnly ? translate('popupSettingsDataKeepFiles') : translate('commonYes'),
				canCancel: localOnly,
				textCancel: translate('popupSettingsDataRemoveFiles'),
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

});

export default PopupSettingsPageDataManagement;
