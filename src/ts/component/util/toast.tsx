import * as React from 'react';
import { observer } from 'mobx-react';
import { commonStore } from 'Store';
import { Util, DataUtil } from 'Lib';

interface State {
    object: any,
    target: any
};

const Toast = observer(class Toast extends React.Component<any, State> {

    state = {
        object: {
            id: null,
            name: ''
        },
        target: {
            id: null,
            name: ''
        }
    };

    render () {
        const { toast } = commonStore;
        const { objectsLength, action, noButtons, noOpen, noUndo } = toast;
        const { object, target } = this.state;

        const undo = !noUndo ? <div onClick={this.onUndo} className="toastButton">Undo</div> : '';
        const open = !noOpen ? <div onClick={this.onOpen} className="toastButton">Open</div> : '';

        const buttons = !noButtons ? <div className="buttons">
            {open}
            {undo}
        </div> : '';

        const objectName = objectsLength && objectsLength > 1 ? `${objectsLength} items` : DataUtil.getObjectName(object);

        return (
            <div id="toast" className="toast">
                <div className="inner">
                    <div className="message">
                        <div className="objectName">{objectName}</div>
                        <div className="action">{action}</div>
                        <div className="targetName">{DataUtil.getObjectName(target)}</div>
                    </div>
                    {buttons}
                </div>
            </div>
        );
    };

    componentDidUpdate () {
        this.updateObject();
        this.updateTarget();
    };

    updateObject () {
        const { toast } = commonStore;
        const { objectId } = toast;
        const { object } = this.state;

        if (objectId === object.id || !object.id) {
            return;
        };

        if (!objectId) {
            this.setState({ object: { id: null, name: '' }});
            return;
        };

        DataUtil.getObjectById(objectId, (message) => {
            if (message.error.code) {
                return;
            };
            this.setState({ object: message.records[0] });
        });
    };

    updateTarget () {
        const { toast } = commonStore;
        const { targetId } = toast;
        const { target } = this.state;

        if (targetId === target.id || !target.id) {
            return;
        };

        if (!targetId) {
            this.setState({ target: { id: null, name: '' }});
            return;
        };

        DataUtil.getObjectById(targetId, (message) => {
            if (message.error.code) {
                return;
            };
            this.setState({ target: message.records[0] });
        });
    };

    onUndo () {
        const { toast } = commonStore;
        const { undo } = toast;

        if (undo) {
            undo();
        };
        Util.toastHide(true);
    };

    onOpen () {
        const { toast } = commonStore;
        const { targetId } = toast;

        DataUtil.objectOpenRoute({id: targetId});
        Util.toastHide(true);
    };

});

export default Toast;