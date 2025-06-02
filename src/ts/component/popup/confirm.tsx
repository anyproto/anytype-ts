import * as React from 'react';
import { Title, Icon, Label, Button, Checkbox, Error, Input } from 'Component';
import { I, keyboard, translate, Storage } from 'Lib';
import { observer } from 'mobx-react';
import { forwardRef } from 'react';

const PopupConfirm = observer(forwardRef<{}, I.Popup>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { title, text, icon, storageKey, confirmMessage } = data;
	const [error, setError] = React.useState<string>(String(data.error || ''));
	const buttonsRef = React.useRef<any>(null);
	const checkboxRef = React.useRef<any>(null);
	const inputRef = React.useRef<any>(null);
	const nRef = React.useRef<number>(0);

	const canConfirm = undefined === data.canConfirm ? true : data.canConfirm;
	const canCancel = undefined === data.canCancel ? true : data.canCancel;
	const textConfirm = data.textConfirm || translate('commonOk');
	const textCancel = data.textCancel || translate('commonCancel');
	const colorConfirm = data.colorConfirm || 'black';
	const colorCancel = data.colorCancel || 'blank';
	const bgColor = data.bgColor || '';

	const setHighlight = React.useCallback(() => {
		const buttons = $(buttonsRef.current).find('.button');
		if (buttons[nRef.current]) {
			$(buttonsRef.current).find('.hover').removeClass('hover');
			$(buttons[nRef.current]).addClass('hover');
		}
	}, []);

	const onMouseEnter = React.useCallback((e: any) => {
		const buttons = $(buttonsRef.current).find('.button');
		nRef.current = $(buttons).index(e.currentTarget);
		setHighlight();
	}, [setHighlight]);

	const onCheck = React.useCallback((e: any) => {
		const value = checkboxRef.current.getValue();
		checkboxRef.current.toggle();
		Storage.set(storageKey, !value);
	}, [storageKey]);

	const onConfirm = React.useCallback((e: any) => {
		const { onConfirm, noCloseOnConfirm, confirmMessage } = data;
		if (confirmMessage) {
			const value = inputRef.current.getValue();
			if (value != confirmMessage) {
				setError(translate('popupConfirmConfirmationTextError'));
				return;
			}
		}
		e.preventDefault();
		if (!noCloseOnConfirm) {
			close();
		}
		if (onConfirm) {
			onConfirm();
		}
	}, [data, close]);

	const onCancel = React.useCallback((e: any) => {
		const { onCancel } = data;
		close();
		if (onCancel) {
			onCancel();
		}
	}, [data, close]);

	const onKeyDown = React.useCallback((e: any) => {
		const { confirmMessage } = data;
		const cmd = keyboard.cmdKey();
		const buttons = $(buttonsRef.current).find('.button');

		keyboard.shortcut('enter, space', e, (pressed: string) => {
			e.stopPropagation();
			if ((pressed === 'space') && confirmMessage) {
				return;
			}
			if (buttons[nRef.current]) {
				$(buttons[nRef.current]).trigger('click');
			}
		});

		keyboard.shortcut('escape', e, () => {
			e.stopPropagation();
			onCancel(e);
		});

		keyboard.shortcut('arrowup, arrowdown, arrowleft, arrowright', e, (pressed: string) => {
			const dir = [ 'arrowup', 'arrowleft' ].includes(pressed) ? 1 : -1;
			if (buttons.length < 2) {
				return;
			}
			nRef.current += dir;
			if (nRef.current < 0) {
				nRef.current = buttons.length - 1;
			}
			if (nRef.current > buttons.length - 1) {
				nRef.current = 0;
			}
			setHighlight();
		});

		keyboard.shortcut(`${cmd}+c`, e, () => {
			e.stopPropagation();
		});
	}, [data, setHighlight, onCancel]);

	React.useEffect(() => {
		keyboard.setFocus(true);
		setHighlight();
		const handler = (e: any) => onKeyDown(e);
		$(window).on('keydown.confirm', handler);
		return () => {
			keyboard.setFocus(false);
			$(window).off('keydown.confirm', handler);
		};
	}, [setHighlight, onKeyDown]);

	const cn = [ 'wrap' ];
	if (storageKey) cn.push('withCheckbox');
	if (confirmMessage) cn.push('withInput');

	return (
		<div className={cn.join(' ')}>
			{icon ? (
				<div className={[ 'iconWrapper', bgColor ].join(' ')}>
					<Icon className={icon} />
				</div>
			) : ''}
			<Title text={title} />
			<Label className="descr" text={text} />

			{storageKey ? (
				<div className="checkboxWrapper" onClick={onCheck}>
					<Checkbox ref={checkboxRef} value={false} />
					<Label text={translate('commonDoNotShowAgain')} />
				</div>
			) : ''}

			{confirmMessage ? (
				<div className="confirmMessage">
					<Input type="text" ref={inputRef} placeholder={confirmMessage} />
				</div>
			) : ''}

			<div ref={buttonsRef} className="buttons">
				{canConfirm ? <Button text={textConfirm} color={colorConfirm} className="c36" onClick={onConfirm} onMouseEnter={onMouseEnter} /> : ''}
				{canCancel ? <Button text={textCancel} color={colorCancel} className="c36" onClick={onCancel} onMouseEnter={onMouseEnter} /> : ''}
			</div>

			<Error text={error} />
		</div>
	);

}));

export default PopupConfirm;
