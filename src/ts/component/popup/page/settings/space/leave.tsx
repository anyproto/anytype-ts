import * as React from 'react';
import { Title, Label, Button } from 'Component';
import { I, translate, Util } from 'Lib';
import { observer } from 'mobx-react';
import Head from '../head';

interface Props extends I.Popup {
    prevPage: string;
    onPage: (id: string) => void;
};

const PopupSettingsSpaceLeave = observer(class PopupSettingsSpaceLeave extends React.Component<Props> {

    render () {
        const space = {
            name: 'Anytype Space',
        };

        return (
            <div>
                <Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />
                <Title text={Util.sprintf(translate('popupSettingsSpaceLeave'), space.name)} />
                <Label text={translate('popupSettingsSpaceLeaveText')} />
                <Button className="blank red" text={translate('popupSettingsSpaceLeaveButton')} />
            </div>
        );
    };

});

export default PopupSettingsSpaceLeave;