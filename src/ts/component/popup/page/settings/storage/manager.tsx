import * as React from 'react';
import { observer } from 'mobx-react';
import { Label, Title, ListObjectManager } from 'Component';
import { analytics, C, FileUtil, I, translate, Util } from 'Lib';
import { popupStore } from 'Store';
import Constant from 'json/constant.json';

import Head from '../head';

const PopupSettingsPageStorageManager = observer(class PopupSettingsPageStorageManager extends React.Component<I.PopupSettings, {}> {

    manager: any = null;

    constructor (props: I.PopupSettings) {
        super(props);

        this.onRemove = this.onRemove.bind(this);
    };

    render () {
        const buttons: I.ButtonComponent[] = [{ icon: 'remove', text: 'Delete immediately', onClick: this.onRemove }];

        const Info = (item: any) => (
            <React.Fragment>
                <Label text={String(FileUtil.size(item.sizeInBytes))} />
            </React.Fragment>
        );

        return (
            <div>
                <Head onPage={this.onBack} name={translate('commonBack')} />
                <Title text={translate('popupSettingsStorageManagerTitle')} />

                <ListObjectManager
                    ref={ref => { this.manager = ref; }}
                    subId={Constant.subId.files}
                    rowLength={2}
                    withArchived={true}
                    buttons={buttons}
                    Info={Info}
                    iconSize={18}
                    sources={[ Constant.typeId.file, Constant.typeId.video, Constant.typeId.audio, Constant.typeId.image ]}
                    textEmpty={translate('popupSettingsStorageEmptyLabel')}
                />
            </div>
        );
    };

    onRemove () {
        if (!this.manager.selected) {
            return;
        };

        const count = this.manager.selected.length;

        analytics.event('ShowDeletionWarning');

        popupStore.open('confirm', {
            data: {
                title: `Are you sure you want to delete ${count} ${Util.cntWord(count, 'object', 'objects')}?`,
                text: 'These objects will be deleted irrevocably. You can\'t undo this action.',
                textConfirm: 'Delete',
                onConfirm: () => {
                    C.ObjectListDelete(this.manager.selected);
                    this.manager.selectionClear();

                    analytics.event('RemoveCompletely', { count });
                },
                onCancel: () => { this.manager.selectionClear(); }
            },
        });
    };

    onBack = () => {
        const { onPage } = this.props;

        onPage('storageIndex');
    };
});

export default PopupSettingsPageStorageManager;