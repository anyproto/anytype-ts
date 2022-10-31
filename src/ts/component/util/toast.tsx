import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject } from 'Component';
import { commonStore } from 'Store';
import {C, Util, DataUtil, I} from 'Lib';

const Toast = observer(class Toast extends React.Component<any, any> {

    state = {
        object: null,
        target: null,
        origin: null
    };

    render () {
        const { toast } = commonStore;
        const { objectsLength, action } = toast;
        const { object, target, origin } = this.state;
        let withButtons = false;

        const undo = <div onClick={() => this.onClick('undo')} className="toastButton">Undo</div>;
        const open = <div onClick={() => this.onClick('open')} className="toastButton">Open</div>;

        let buttons = null;
        let textObject = null;
        let textAction = null;
        let textOrigin = null;
        let textActionTo = null;
        let textTarget = null;

        switch (action) {
            case I.ToastAction.Move:
                if (target) {
                    withButtons = true;

                    textObject = <div>
                        {objectsLength} {Util.cntWord(objectsLength, 'block', 'blocks')}
                    </div>;

                    textAction = 'moved to';

                    textTarget = <div className="name">
                        <IconObject object={target} size={18} />
                        {DataUtil.getObjectName(target)}
                    </div>;


                    if (origin) {
                        textAction = 'moved from';

                        textOrigin = <div className="name">
                            <IconObject object={origin} size={18} />
                            {DataUtil.getObjectName(origin)}
                        </div>;

                        textActionTo = 'to';
                    }
                };
                break;

            case I.ToastAction.Link:
                if (object && target) {
                    textObject = <div className="name">
                        <IconObject object={object} size={18} />
                        {DataUtil.getObjectName(object)}
                    </div>;

                    textAction = 'linked to';

                    textTarget = <div className="name">
                        <IconObject object={target} size={18} />
                        {DataUtil.getObjectName(target)}
                    </div>;
                };
                break;
        };

        if (withButtons) {
            buttons = (
                <div className="buttons">
                    {open}
                    {undo}
                </div>
            );
        };

        return (
            <div id="toast" className="toast">
                <div className="inner">
                    <div className="message">
                        {textObject}
                        {textAction}
                        {textOrigin}
                        {textActionTo}
                        {textTarget}
                    </div>

                    {buttons}
                </div>
            </div>
        );
    };

    componentDidUpdate () {
        this.update();
    };

    update () {
        const { toast } = commonStore;
        const { objectId, targetId, originId, action } = toast;
        const { object, target } = this.state;

        let ids = [];

        const noObject = !objectId && !object;
        const noTarget = !targetId && !target;

        const objectRendered = object && (objectId === object.id);
        const targetRendered = target && (targetId === target.id);

        switch (action) {
            case I.ToastAction.Move:
                if (targetRendered || noTarget) {
                    return;
                }
                if (!targetId) {
                    this.setState({ target: null});
                    return;
                };

                ids.push(targetId);
                ids.push(originId);
                break;

            case I.ToastAction.Link:
                if ((targetRendered && objectRendered) || noTarget || noObject) {
                    return;
                }
                if (!objectId || !targetId) {
                    this.setState({ object: null, target: null});
                    return;
                };

                ids.push(objectId);
                ids.push(targetId);
                break;
        };

        if (ids.length) {
            DataUtil.getObjectsByIds(ids, (message) => {
                if (message.error.code) {
                    return;
                };

                this.setState(this.mapRecords(message.records));
            });
        }
    };

    mapRecords (records: any) {
        const { toast } = commonStore;
        const { objectId, targetId, originId } = toast;
        const recordsObj = this.toObject(records, 'id');

        const state: any = {
            target: recordsObj[targetId]
        };

        if (objectId && recordsObj[objectId]) {
            state.object = recordsObj[objectId];
        };

        if (originId && recordsObj[originId]) {
            state.origin = recordsObj[originId];
        }

        return state;
    };

    toObject (arr: any, key: string) {
        const obj = {};
        for (let i=0;i<arr.length;i++) {
            obj[arr[i][key]] = arr[i];
        }

        return obj
    };

    onClick (action) {

        switch (action) {
            case 'open':
                this.onOpen();
                break;

            case 'undo':
                this.onUndo();
                break;
        };

        Util.toastHide(true);
    };

    onUndo () {
        const { toast } = commonStore;
        const { originId } = toast;

        C.ObjectUndo(originId);
    };

    onOpen () {
        const { toast } = commonStore;
        const { targetId } = toast;

        DataUtil.objectOpenRoute({id: targetId});
    };

});

export default Toast;