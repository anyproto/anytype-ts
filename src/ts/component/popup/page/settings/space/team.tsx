import * as React from 'react';
import { Title, Label, Select, Button } from 'Component';
import { I, translate, Util } from 'Lib';
import { observer } from 'mobx-react';
import Head from '../head';

interface Props extends I.Popup {
    prevPage: string;
    onPage: (id: string) => void;
};

const PopupSettingsSpaceTeam = observer(class PopupSettingsSpaceTeam extends React.Component<Props> {

    render () {
        const { onPage } = this.props;
        const space = {
            name: 'Anytype Space',
            homepage: 'Bla bla page',
            team: []
        };

        return (
            <div>
                <Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />
                <Title text={`${space.name} team`} />
                <Label className="spaceTeamCounter" text={`${space.team.length} ${translate('popupSettingsSpaceTeamMembers')}`} />

                <div className="buttons">
                    <Button onClick={() => onPage('spaceInvite')} text={translate('popupSettingsSpaceTeamButton')} />
                </div>
            </div>
        );
    };

});

export default PopupSettingsSpaceTeam;