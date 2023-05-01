import * as React from 'react';
import { observer } from 'mobx-react';
import { Title } from 'Component';
import { I, translate } from 'Lib';
import Head from '../head';

const PopupSettingsPageStorageManager = observer(class PopupSettingsPageStorageManager extends React.Component<I.PopupSettings, {}> {

    render () {
        return (
            <div>
                <Head onPage={this.onBack} name={translate('commonBack')} />
                <Title text={translate('popupSettingsStorageManagerTitle')} />
            </div>
        );
    };

    onBack = () => {
        const { onPage } = this.props;

        onPage('storageIndex');
    };

});

export default PopupSettingsPageStorageManager;