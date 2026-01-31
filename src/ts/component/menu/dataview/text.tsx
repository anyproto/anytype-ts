import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Editable, MenuItemVertical, Icon, Input } from 'Component';
import { I, J, U, S, keyboard } from 'Lib';

const MenuDataviewText = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, getId, position, setActive, onKeyDown, setHover, close } = props;
	const { data } = param;
	const { value, placeholder, canEdit, noResize, cellId, onChange, relationKey, actions = [], onSelect } = data;
	const relation = S.Record.getRelationByKey(relationKey);
	const isSingleLine = [ I.RelationType.Url, I.RelationType.Email, I.RelationType.Phone, I.RelationType.Number ].includes(relation?.relationFormat);
	const inputWrapper = useRef(null);
	const inputRef = useRef(null);
	const n = useRef(-1);
	const length = value.length;
	const valueRef = useRef(value);

	useEffect(() => {
		rebind();

		return () => {
			save();
			unbind();
		};
	});

	const rebind = () => {
		unbind();
		
		if (inputRef.current) {
			inputRef.current.setValue(U.String.htmlSpecialChars(value));
			inputRef.current.setRange({ from: length, to: length });
			inputRef.current.placeholderCheck?.();
			inputRef.current.setFocus();
		};

		resize();

		window.setTimeout(() => {
			setActive();
			$(window).on('keydown.menu', e => onKeyDownHandler(e));
		}, 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getValue = () => {
		const v = isSingleLine ? inputRef.current?.getValue() : inputRef.current?.getTextValue();
		return String(v || '').trim();
	};

	const onKeyDownHandler = (e: any) => {
		let ret = false;

		if (inputRef.current?.isFocused()) {
			keyboard.shortcut('arrowdown', e, () => {
				inputRef.current?.setBlur();
			});

			if (isSingleLine) {
				keyboard.shortcut(`enter`, e, () => {
					e.preventDefault();
					ret = true;
					close();
				});
			};
		} else
		if (!n.current) {
			keyboard.shortcut('arrowup', e, () => {
				inputRef.current?.setFocus();
				n.current = -1;
			});
			keyboard.shortcut(`enter`, e, () => {
				e.preventDefault();
				ret = true;
				onClick(e, actions[n.current]);
			});
		};

		if (!ret) {
			onKeyDown(e);
		};
	};

	const onInput = (e: any, v: string) => {
		valueRef.current = isSingleLine ? String(v || '').trim() : getValue();
		resize();
	};

	const save = () => {
		onChange?.(valueRef.current);
	};

	const resize = () => {
		if (noResize) {
			return;
		};

		const obj = $(`#${getId()}`);
		const input = obj.find('#input');
		const { wh } = U.Common.getWindowDimensions();
		const hh = J.Size.header;
		const cell = $(`#${cellId}`);

		raf(() => {
			const sh = input.get(0).scrollHeight;
			const height = Math.max(32, Math.min(wh - hh - 20, Math.max(cell.outerHeight(), sh)));

			obj.css({ height });
			position();
		});
	};

	const onClick = (e: any, action: any) => {
		onSelect(e, action);
		close();
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onMouseLeave = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setHover(null, false);
		};
		if (inputRef.current?.isFocused()) {
			n.current = -1;
		};
	};

	const onFocus = () => {
		setHover(null, false);
		$(inputWrapper.current).addClass('focused');
	};

	const onBlur = () => {
		$(inputWrapper.current).removeClass('focused');
	};

	const onClear = () => {
		inputRef.current.setValue('');
		inputRef.current.placeholderCheck?.();
		inputRef.current.setFocus();
	};

	let menuItems: any = null;
	if (actions.length) {
		menuItems = (
			<div className="items">
				{actions.map((action: any, i: number) => (
					<MenuItemVertical
						key={i}
						{...action}
						icon={action.icon}
						onClick={e => onClick(e, action)}
						onMouseEnter={e => onMouseEnter(e, action)}
						onMouseLeave={e => onMouseLeave(e, action)}
					/>
				))}
			</div>
		);
	};

	useImperativeHandle(ref, () => ({
		getItems: () => actions,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
	}), []);

	return (
		<div className="innerWrapper">
			<div
				ref={inputWrapper}
				className="inputWrapper"
				onMouseEnter={() => setHover(null, false)}
			>
				{isSingleLine ? (
					<>
						<Input 
							ref={inputRef}
							id="input"
							placeholder={placeholder}
							readonly={!canEdit}
							onInput={onInput}
							onPaste={onInput}
							onFocus={onFocus}
							onBlur={onBlur}
						/>
						<Icon className="clear withBackground" onClick={onClear} />
					</>
				) : (
					<Editable
						ref={inputRef}
						id="input"
						placeholder={placeholder}
						readonly={!canEdit}
						onInput={(e) => onInput(e, '')}
						onPaste={(e) => onInput(e, '')}
						onFocus={onFocus}
						onBlur={onBlur}
					/>
				)}
			</div>
			{menuItems}
		</div>
	);

}));

export default MenuDataviewText;