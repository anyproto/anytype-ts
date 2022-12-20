import * as React from 'react';
import { observer } from 'mobx-react';
import { Button, IconObject, ObjectName } from 'Component';
import { commonStore } from 'Store';
import { I, C, Util, DataUtil, ObjectUtil, Preview, analytics, translate, keyboard } from 'Lib';

interface State {
	object: any;
	target: any;
	origin: any;
};

const Toast = observer(class Toast extends React.Component<{}, State> {

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
			default:
				textAction = text;
				break;

            case I.ToastAction.Lock:
                if (!object) {
                    break;
                };

                textObject = <Element {...object} />;
                textAction = value ? 'is locked' : 'is unlocked';
                break;

            case I.ToastAction.Move:
                if (!target) {
					break;
				};

				const cnt = `${count} ${Util.cntWord(count, 'block', 'blocks')}`;

				textAction = `${cnt} moved to`;
				textTarget = <Element {...target} />;

				if (origin) {
					textAction = `${cnt} moved from`;
					textActionTo = translate('commonTo');
					textOrigin = <Element {...origin} />;
				};

				buttons = buttons.concat([
					{ action: 'open', label: 'Open' },
					{ action: 'undo', label: 'Undo' }
				]);
                break;

            case I.ToastAction.Link:
                if (!object || !target) {
					break;
				};

				textAction = 'linked to';
				textObject = <Element {...object} />;
				textTarget = <Element {...target} />;

                if (target.id != keyboard.getRootId()) {
                    buttons = buttons.concat([
                        { action: 'open', label: 'Open' }
                    ]);
                };
                break;
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
								<Button text={item.label} onClick={(e: any) => { this.onClick(e, item.action); }} key={i} className="toastButton" />
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
            case 'open':
                this.onOpen(e);
                break;

            case 'undo':
                this.onUndo(e);
                break;
        };

		this.close();
    };

    onUndo (e: any) {
        C.ObjectUndo(commonStore.toast.originId);
		analytics.event('Undo', { route: 'toast' });
    };

    onOpen (e: any) {
        ObjectUtil.openEvent(e, commonStore.toast.target);
    };

});

export default Toast;