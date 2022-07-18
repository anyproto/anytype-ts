import * as React from 'react';
import { I } from 'ts/lib';
import {authStore} from 'ts/store';
import {Button} from 'ts/component';

const { dialog } = window.require('@electron/remote');

interface Props extends I.Menu {};

class MenuAccountPath extends React.Component<Props, {}> {

    constructor (props: any) {
        super(props);

        // this.onClick = this.onClick.bind(this);
    };

    render () {
        const { param } = this.props;
        const { data } = param;

        return (
            <div className="menuAccountPath">
                <p className="menuTitle">Account data location</p>
                <p>{data.accountPath}</p>
                <Button onClick={this.onPathClick} text={'Customize'} color="grey" className="c28" />
            </div>
        );
    };

    onPathClick (e: any) {
        const options = {
            properties: [ 'openDirectory' ],
        };

        dialog.showOpenDialog(options).then((result: any) => {
            const files = result.filePaths;
            if ((files == undefined) || !files.length) {
                return;
            };

            authStore.accountPathSet(files[0]);
        });
    };

};

export default MenuAccountPath;
