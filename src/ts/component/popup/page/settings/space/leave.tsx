import * as React from 'react';
import { Title, Label, Button } from 'Component';
import { I, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';
import Head from '../head';

const PopupSettingsSpaceLeave = observer(class PopupSettingsSpaceLeave extends React.Component<I.PopupSettings> {

    render () {
        const space = {
            name: translate('popupSettingsSpaceAnytypeSpace'),
        };

        return (
            <div>
                <Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />
                <Title text={UtilCommon.sprintf(translate('popupSettingsSpaceLeave'), space.name)} />
                <Label text={translate('popupSettingsSpaceLeaveText')} />
                <Button color="red" className="c36" text={translate('popupSettingsSpaceLeaveButton')} />
            </div>
        );
    };

});

export default PopupSettingsSpaceLeave;
