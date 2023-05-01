import * as React from 'react';
import { Title, Label } from 'Component';
import { I, translate } from 'Lib';
import { observer } from 'mobx-react';

const PopupSettingsPageStorageIndex = observer(class PopupSettingsPageStorageIndex extends React.Component<I.PopupSettings> {

    render () {

        return (
            <React.Fragment>
                <Title text={translate('popupSettingsStorageIndexTitle')} />
                <Label className="description" text={translate('popupSettingsStorageIndexText')} />

            </React.Fragment>
        );
    };

});

export default PopupSettingsPageStorageIndex;
