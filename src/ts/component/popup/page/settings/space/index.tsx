import * as React from 'react';
import { Icon, Title, Label, IconObject } from 'Component';
import {analytics, C, I, translate} from 'Lib';
import { observer } from 'mobx-react';
import {detailStore, menuStore} from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.Popup {
    prevPage: string;
    onPage: (id: string) => void;
};

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<Props> {

    homePage: any = null;
    team: any[] = [];
    isAdmin: boolean = true;

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

        let teamPreview = (
            <div className="spaceTeamPreview">
                {
                    this.team.slice(0,3).map((el, i) => (
                        <IconObject size={32} key={i} object={el} />
                    ))
                }
            </div>
        );

        if (!this.team.length) {
            teamPreview = <Icon className="arrow light" />;
        };

        let spaceLeave = (
            <div className="row red" onClick={() => { onPage('spaceLeave'); }}>
                <Label text={translate('popupSettingsSpaceLeaveTitle')} />
            </div>
        );

        if (this.isAdmin) {
            spaceLeave = (
                <div className="row red" onClick={() => { onPage('spaceRemove'); }}>
                    <Label text={translate('popupSettingsSpaceRemoveTitle')} />
                </div>
            );
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

                    <div className="row flex" onClick={() => { onPage('spaceTeam'); }}>
                        <div className="side left">
                            <Label text={translate('popupSettingsSpaceTeamTitle')} />
                        </div>
                        <div className="side right">
                            {teamPreview}
                        </div>
                    </div>

                    {spaceLeave}
                </div>
            </div>
        );
    };

    componentDidMount() {
        this.loadProfiles();
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

    loadProfiles () {
        const filters = [
            { operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: 'ot-profile' }
        ];

        C.ObjectSearch(filters, [], [], '', 0, 0, (message: any) => {
            if (message.error.code || !message.records.length) {
                return;
            };

            this.team = message.records.map(it => detailStore.check(it)).filter(it => !it._empty_);
            this.forceUpdate();
        });
    };

});

export default PopupSettingsSpaceIndex;