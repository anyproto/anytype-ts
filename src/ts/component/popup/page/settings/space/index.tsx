import * as React from 'react';
import { Icon, Title, Label } from 'Component';
import { analytics, I, translate } from 'Lib';
import { observer } from 'mobx-react';
import { menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.Popup {
    prevPage: string;
    onPage: (id: string) => void;
};

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<Props> {

    homePage: any = null;

    constructor (props: any) {
        super(props);

        this.onHomePage = this.onHomePage.bind(this);
    };

    render () {
        const { onPage } = this.props;

        const space = {
            name: 'Anytype Space',
            homepage: 'Bla bla page',
            team: []
        };

        return (
            <div>
                <Title text={space.name} />

                <div className="rows">
                    <div className="row" onClick={() => { onPage('spaceInvite'); }}>
                        <Label text={translate('popupSettingsSpaceInviteTitle')} />
                        <Icon className="arrow" />
                    </div>

                    <div className="row flex">
                        <div className="side left">
                            <Label text={translate('popupSettingsSpaceHomepageTitle')} />
                        </div>
                        <div className="side right">
                            <div id="homePage" className="select" onClick={this.onHomePage}>
                                <div className="item">
                                    <div className="name">{this.homePage || 'Select'}</div>
                                </div>
                                <Icon className="arrow light" />
                            </div>
                        </div>
                    </div>

                    <div className="row" onClick={() => { onPage('spaceTeam'); }}>
                        <Label text={translate('popupSettingsSpaceTeamTitle')} />
                    </div>

                    <div className="row red" onClick={() => { onPage('spaceLeave'); }}>
                        <Label text={translate('popupSettingsSpaceLeaveTitle')} />
                    </div>
                </div>
            </div>
        );
    };

    onHomePage () {
        const { getId } = this.props;

        menuStore.open('searchObject', {
            element: `#${getId()} #homePage`,
            horizontal: I.MenuDirection.Right,
            data: {
                filters: [
                    { operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.page }
                ],
                position: I.BlockPosition.Bottom,
                canAdd: true,
                onSelect: (el: any) => {
                    this.homePage = el.name;
                    this.forceUpdate();
                }
            }
        });
    };

});

export default PopupSettingsSpaceIndex;