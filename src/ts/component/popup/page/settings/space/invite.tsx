import * as React from 'react';
import { Title, Label, Select, Button } from 'Component';
import { I, translate, UtilCommon } from 'Lib';
import { observer } from 'mobx-react';
import Head from '../head';

const PopupSettingsSpaceInvite = observer(class PopupSettingsSpaceInvite extends React.Component<I.PopupSettings> {

    memberType = 'reader';

    render () {
        const memberTypes = [
            { id: 'reader', name: translate('popupSettingsSpaceMemberTypeReader')},
            { id: 'editor', name: translate('popupSettingsSpaceMemberTypeEditor')},
            { id: 'admin', name: translate('popupSettingsSpaceMemberTypeAdmin')}
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
								menuParam={{ horizontal: I.MenuDirection.Right }}
                                onChange={(v: any) => {
                                    this.memberType = v;
                                    this.forceUpdate();
                                }}
                            />
                        </div>
                    </div>
                </div>

                <Label className="description" text={translate(`popupSettingsSpaceInviteMemberTypeText${UtilCommon.toUpperCamelCase(this.memberType)}`)} />
                <Button className="c36" text={translate('popupSettingsSpaceInviteButton')} />
            </div>
        );
    };

});

export default PopupSettingsSpaceInvite;
