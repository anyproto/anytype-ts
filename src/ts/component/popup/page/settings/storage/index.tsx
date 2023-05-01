import * as React from 'react';
import { Title, Label, IconObject, ObjectName, Button } from 'Component';
import { analytics, I, translate } from 'Lib';
import { observer } from 'mobx-react';
import { commonStore, detailStore } from 'Store';
import Constant from "json/constant.json";

const PopupSettingsPageStorageIndex = observer(class PopupSettingsPageStorageIndex extends React.Component<I.PopupSettings> {

    render () {
        const space = detailStore.get(Constant.subId.space, commonStore.workspace);

        return (
            <React.Fragment>
                <Title text={translate('popupSettingsStorageIndexTitle')} />
                <Label className="description" text={translate('popupSettingsStorageIndexText')} />

                <div className="storageUsage">
                    <div className="space">
                        <IconObject object={space} forceLetter={true} size={44} />
                        <div className="txt">
                            <ObjectName object={space} />
                            <div className="type">{translate(`popupSettingsStorageIndexUsage`)}</div>
                        </div>
                    </div>
                    <Button className="c28 outlined" text={translate('popupSettingsStorageIndexManageFiles')} onClick={this.onManageFiles} />
                </div>

                <Title className="sub" text={translate('popupSettingsStorageIndexLocalStorageTitle')} />
                <Label className="description" text={translate('popupSettingsStorageIndexLocalStorageText')} />

                <div className="storageUsage">
                    <div className="space">
                        <IconObject className="localStorageIcon" object={{ iconEmoji: ':desktop_computer:' }} size={44} />
                        <div className="txt">
                            <ObjectName object={space} />
                            <div className="type">{translate(`popupSettingsStorageIndexLocalStorageUsage`)}</div>
                        </div>
                    </div>
                    <Button className="c28 outlined" text={translate('popupSettingsStorageIndexOffloadFiles')} onClick={this.onOffloadFiles} />
                </div>

            </React.Fragment>
        );
    };

    onManageFiles = () => {
        const { onPage } = this.props;

        onPage('storageManager');
    };

    onOffloadFiles () {
        console.log('OFFLOAD')
    };

});

export default PopupSettingsPageStorageIndex;
