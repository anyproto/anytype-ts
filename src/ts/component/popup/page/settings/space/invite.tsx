import * as React from 'react';
import { Title, Label, Select, Button } from 'Component';
import { I, translate, Util } from 'Lib';
import { observer } from 'mobx-react';
import Head from '../head';

interface Props extends I.Popup {
    prevPage: string;
    onPage: (id: string) => void;
};

const PopupSettingsSpaceInvite = observer(class PopupSettingsSpaceInvite extends React.Component<Props> {

    memberType = 'reader';

    render () {
        const memberTypes = [
            { id: 'reader', name: 'Reader'},
            { id: 'editor', name: 'Editor'},
            { id: 'admin', name: 'Admin'}
        ];

        return (
            <div>
                <Head {...this.props} returnTo="spaceIndex" name={translate('popupSettingsSpaceIndexTitle')} />
                <Title text={translate('popupSettingsSpaceInviteTitle')} />

                <div className="rows">
                    <div className="row">
                        <div className="side left">
                            <Label text={translate('popupSettingsSpaceInviteMemberRights')} />
                        </div>
                        <div className="side right">
                            <Select
                                id="memberType"
                                value={this.memberType}
                                options={memberTypes}
                                arrowClassName="light"
                                horizontal={I.MenuDirection.Right}
                                onChange={(v: any) => {
                                    this.memberType = v;
                                    this.forceUpdate();
                                }}
                            />
                        </div>
                    </div>
                </div>

                <Label className="description" text={translate(`popupSettingsSpaceInviteMemberTypeText${Util.toUpperCamelCase(this.memberType)}`)} />
                <Button text={translate('popupSettingsSpaceInviteButton')} />
            </div>
        );
    };

});

export default PopupSettingsSpaceInvite;