import * as React from 'react';
import { I } from 'Lib';
import { Button, Label } from 'Component';
import { authStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const MenuAccountPath = observer(class MenuAccountPath extends React.Component<Props, {}> {

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

        window.Electron.showOpenDialog(options).then((result: any) => {
            const files = result.filePaths;
            if ((files == undefined) || !files.length) {
                return;
            };

            authStore.accountPathSet(files[0]);
        });
    };

});

export default MenuAccountPath;
