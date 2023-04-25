import * as React from 'react';
import { Title, Label, Button } from 'Component';
import { I, translate, Util } from 'Lib';
import { observer } from 'mobx-react';
import Head from '../head';

const PopupSettingsSpaceLeave = observer(class PopupSettingsSpaceLeave extends React.Component<I.PopupSettings> {

    render () {
        const space = {
            name: 'Anytype Space',
        };

        return (
            <div>
                <Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />
                <Title text={Util.sprintf(translate('popupSettingsSpaceLeave'), space.name)} />
                <Label text={translate('popupSettingsSpaceLeaveText')} />
                <Button color="red" className="c36" text={translate('popupSettingsSpaceLeaveButton')} />
            </div>
        );
    };

});

export default PopupSettingsSpaceLeave;