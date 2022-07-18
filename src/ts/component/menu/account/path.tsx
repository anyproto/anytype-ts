import * as React from 'react';
import { I } from 'ts/lib';
import { Button, Label, Title } from 'ts/component';
import { authStore } from 'ts/store';

interface Props extends I.Menu {};

const { dialog } = window.require('@electron/remote');

class MenuAccountPath extends React.Component<Props, {}> {

    constructor (props: any) {
        super(props);

        this.onClick = this.onClick.bind(this);
    };

    render () {
		const { accountPath } = authStore;

        return (
            <div>
                <Label className="bold" text="Account data location" />
                <Label text={accountPath} onClick={this.onClick} />
                <Button onClick={this.onClick} text={'Customize'} color="grey" className="c28" />
            </div>
        );
    };

    onClick (e: any) {
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
