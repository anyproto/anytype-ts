import * as React from 'react';
import { IconObject, ObjectName, Input, Label } from 'Component';
import { blockStore, detailStore, menuStore } from 'Store';
import {C, I, ObjectUtil, DataUtil, SmileUtil} from 'Lib';

import Constant from 'json/constant.json';

interface Props {
    profile: any;
    setLoading: (v: boolean) => void;
};

class PopupSettingsUserInfo extends React.Component<Props, object> {

    constructor (props: any) {
        super(props);

        this.onUserpic = this.onUserpic.bind(this);
        this.onUserpicUpload = this.onUserpicUpload.bind(this);
        this.onUsername = this.onUsername.bind(this);
    };

    render () {
        const { profile } = this.props;

        return (
            <div className="userInfo">
                <IconObject id="userInfoUserpic" className="userPic" object={profile} size={80} onClick={this.onUserpic} />

                <div className="userName">
                    <Label className="sectionName" text="Name" />
                    <Input value={profile.name} onKeyUp={this.onUsername} placeholder={DataUtil.defaultName('page')} />
                </div>
            </div>
        );
    };

    onUserpic () {
        const object = detailStore.get(Constant.subId.profile, blockStore.profile);

        if (!object.iconImage) {
            this.onUserpicUpload(object.id);
            return;
        };

        const options = [
            { id: 'upload', name: 'Change' },
            { id: 'remove', name: 'Remove' }
        ];

        menuStore.open('select', {
            element: `#userInfoUserpic`,
            horizontal: I.MenuDirection.Center,
            data: {
                value: '',
                options: options,
                onSelect: (event: any, item: any) => {
                    if (item.id == 'remove') {
                        ObjectUtil.setIcon(object.id, '', '');
                    };
                    if (item.id == 'upload') {
                        this.onUserpicUpload(object.id);
                    };
                },
            }
        });
    };

    onUserpicUpload (rootId) {
        const { setLoading } = this.props;

        const options = {
            properties: [ 'openFile' ],
            filters: [ { name: '', extensions: Constant.extension.cover } ]
        };

        window.Electron.showOpenDialog(options).then((result) => {
            const files = result.filePaths;
            if ((files == undefined) || !files.length) {
                return;
            };

            setLoading(true);

            C.FileUpload('', files[0], I.FileType.Image, (message: any) => {
                if (message.error.code) {
                    return;
                };

                ObjectUtil.setIcon(rootId, '', message.hash, () => {
                    setLoading(false);
                });
            });
        });
    };

    onUsername (e: any) {
        const { profile } = this.props;

        ObjectUtil.setName(profile.id, e.target.value);
    };

};

export default PopupSettingsUserInfo;