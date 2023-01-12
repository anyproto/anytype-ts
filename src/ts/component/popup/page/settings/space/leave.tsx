import * as React from 'react';
import { Title, Label, Select, Button } from 'Component';
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
            homepage: 'Bla bla page',
            team: []
        };

        return (
            <div>
                <Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />
                <Title text={`${translate('popupSettingsSpaceInviteTitle')} ${space.name}`} />

                <Label className="leaveSpaceDescription" text={translate('popupSettingsSpaceLeaveText')} />

                <Button className="blank red" text={translate('popupSettingsSpaceLeaveButton')} />
            </div>
        );
    };

});

export default PopupSettingsSpaceLeave;