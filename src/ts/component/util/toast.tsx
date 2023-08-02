import * as React from 'react';
import { observer } from 'mobx-react';
import { Button, IconObject, ObjectName } from 'Component';
import { commonStore, popupStore } from 'Store';
import { I, C, UtilCommon, UtilObject, Preview, analytics, translate, keyboard } from 'Lib';

interface State {
	object: any;
	target: any;
	origin: any;
};

const Toast = observer(class Toast extends React.Component<object, State> {

    state = {
        object: null,
        target: null,
        origin: null,
    };

	constructor (props: any) {
		super(props);

		this.close = this.close.bind(this);
	};

    render () {
        const { toast } = commonStore;
		if (!toast) {
			return null;
		};

        const { count, action, text, value, object, target, origin } = toast;

        let buttons = [];
        let textObject = null;
        let textAction = null;
        let textOrigin = null;
        let textActionTo = null;
        let textTarget = null;

		const Element = (item: any) => (
			<div className="chunk">
				<IconObject object={item} size={18} />
				<ObjectName object={item} />
			</div>
		);

        switch (action) {
			default: {
				textAction = text;
				break;
			};

            case I.ToastAction.Lock: {
                if (!object) {
                    break;
                };

                textObject = <Element {...object} />;
                textAction = translate(value ? 'toastIsLocked' : 'toastIsUnlocked');
                break;
			};

            case I.ToastAction.Move: {
                if (!target) {
					break;
				};

				const cnt = `${count} ${UtilCommon.plural(count, translate('pluralBlock'))}`;

				textAction = UtilCommon.sprintf(translate('toastMovedTo'), cnt);
				textTarget = <Element {...target} />;

				if (origin) {
					textAction = UtilCommon.sprintf(translate('toastMovedFrom'), cnt);
					textActionTo = translate('commonTo');
					textOrigin = <Element {...origin} />;
				};

				buttons = buttons.concat([
					{ action: 'open', label: translate('commonOpen') },
					{ action: 'undo', label: translate('commonUndo') }
				]);
                break;
			};

			case I.ToastAction.Collection:
            case I.ToastAction.Link: {
                if (!object || !target) {
					break;
				};

				textAction = translate(action == I.ToastAction.Collection ? 'toastAddedToCollection' : 'toastLinkedTo');
				textObject = <Element {...object} />;
				textTarget = <Element {...target} />;

                if (target.id != keyboard.getRootId()) {
                    buttons = buttons.concat([
                        { action: 'open', label: translate('commonOpen') }
                    ]);
                };
                break;
			};

            case I.ToastAction.StorageFull: {
                textAction = translate('toastUploadLimitExceeded');

                buttons = buttons.concat([ 
					{ action: 'manageStorage', label: translate('toastManageFiles') }
				]);
            };

            case I.ToastAction.TemplateCreate: {
                if (!object) {
                    break;
                };

                textObject = <Element {...object} />;
                textAction = translate('toastTemplateCreate');
                break;
            };
        };

        return (
            <div id="toast" className="toast" onClick={this.close}>
                <div className="inner">
                    <div className="message">
                        {textObject}
                        {textAction ? <span dangerouslySetInnerHTML={{ __html: textAction }} /> : ''}
                        {textOrigin}
						{textActionTo ? <span dangerouslySetInnerHTML={{ __html: textActionTo }} /> : ''}
                        {textTarget}
                    </div>

                    {buttons.length ? (
						<div className="buttons">
							{buttons.map((item: any, i: number) => (
								<Button key={i} text={item.label} onClick={e => this.onClick(e, item.action)} />
							))}
						</div>
					) : ''}
                </div>
            </div>
        );
    };

    componentDidUpdate () {
        Preview.toastPosition();
    };

	close () {
		Preview.toastHide(true);
	};

    onClick (e: any, action: string) {
       
		switch (action) {
            case 'open': {
                this.onOpen(e);
                break;
			};

            case 'undo': {
                keyboard.onUndo(commonStore.toast.originId, 'Toast');
                break;
			};

            case 'manageStorage': {
                popupStore.open('settings', { data: { page: 'storageManager' }});
                commonStore.toastClear();
            };
        };

		this.close();
    };

    onOpen (e: any) {
        UtilObject.openEvent(e, commonStore.toast.target);
    };

});

export default Toast;
