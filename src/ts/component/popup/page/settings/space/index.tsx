import * as React from 'react';
import { Icon, Title, Label, Input, IconObject } from 'Component';
import { analytics, C, DataUtil, I, ObjectUtil, translate } from 'Lib';
import { observer } from 'mobx-react';
import { detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.Popup {
    prevPage: string;
    onPage: (id: string) => void;
};

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<Props> {

    name: string = 'Anytype Space';
    nameRef: any = {};
    homePage: any = null;
    team: any[] = [];
    isAdmin: boolean = false;

    constructor (props: any) {
        super(props);

        this.onHomePage = this.onHomePage.bind(this);
        this.onIconClick = this.onIconClick.bind(this);
        this.onUpload = this.onUpload.bind(this);
    };

    render () {
        const { onPage } = this.props;

        const cnIcon = ['spaceIcon'];

        let title = <Title text={this.name} />;

        let spaceLeave = (
            <div className="row red" onClick={() => { onPage('spaceLeave'); }}>
                <Label text={translate('popupSettingsSpaceLeaveTitle')} />
            </div>
        );

        if (this.isAdmin) {
            cnIcon.push('canEdit');

            title = <Input
                className="title spaceTitleInput"
                ref={ref => this.nameRef = ref}
                value={this.name}
                placeholder={DataUtil.defaultName('page')}
                onKeyUp={this.onName}
            />;

            spaceLeave = (
                <div className="row red" onClick={() => { onPage('spaceRemove'); }}>
                    <Label text={translate('popupSettingsSpaceRemoveTitle')} />
                </div>
            );
        };

        const teamPreview = this.team.length ? (
            <div className="spaceTeamPreview">
                {
                    this.team.slice(0,3).map((el, i) => (
                        <IconObject size={32} key={i} object={el} />
                    ))
                }
            </div>
        ) : <Icon className="arrow light" />;

        return (
            <div>
                <div className="spaceSettingsHeader">
                    <IconObject
                        id="spacePic"
                        className={cnIcon.join(' ')}
                        size={96}
                        object={{name: this.name, layout: I.ObjectLayout.Human, id: 'randomIdOfTheTestObject'}}
                        onClick={this.onIconClick}
                    />

                    {title}
                </div>

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

    onIconClick () {
        const { getId } = this.props;

        if (!this.isAdmin) {
            return;
        }

        // if (!object.iconImage) {
        //     this.onUpload(object.id);
        //     return;
        // };

        const options = [
            { id: 'upload', name: 'Change' },
            { id: 'remove', name: 'Remove' }
        ];

        menuStore.open('select', {
            element: `#${getId()} #spacePic`,
            horizontal: I.MenuDirection.Center,
            data: {
                value: '',
                options,
                onSelect: (e: any, item: any) => {
                    switch (item.id) {
                        case 'upload': {
                            // this.onUpload(object.id);
                            break;
                        };

                        case 'remove': {
                            // ObjectUtil.setIcon(object.id, '', '');
                            break;
                        };
                    };
                },
            }
        });
    };

    onUpload () {
        const options = {
            properties: [ 'openFile' ],
            filters: [ { name: '', extensions: Constant.extension.image } ]
        };

        window.Electron.showOpenDialog(options).then((result) => {
            const files = result.filePaths;
            if ((files == undefined) || !files.length) {
                return;
            };

            this.setState({ loading: true });

            C.FileUpload('', files[0], I.FileType.Image, (message: any) => {
                if (message.error.code) {
                    return;
                };

                // ObjectUtil.setIcon(rootId, '', message.hash, () => {
                //     this.setState({ loading: false });
                // });
            });
        });
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

    onName (v: string) {
        // set space name
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