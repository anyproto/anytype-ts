import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import { Editable, MenuItemVertical, Icon, Input } from 'Component';
import * as I from 'Interface';

const MenuDataviewText = forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, getId, getContainer, position, setActive, onKeyDown, setHover, close } = props;
	const { data } = param;
	const { value, placeholder, canEdit, noResize, cellId, onChange, relationKey, actions = [], onSelect } = data;
	const relation = S.Record.getRelationByKey(relationKey);
	const isSingleLine = [ I.RelationType.Url, I.RelationType.Email, I.RelationType.Phone, I.RelationType.Number ].includes(relation?.relationFormat);
	const inputWrapper = useRef(null);
	const inputRef = useRef(null);
	const n = useRef(-1);
	const keydownHandler = useRef(null);
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

		window.setTimeout(() => {
			setActive();
			keydownHandler.current = (e: any) => onKeyDownHandler(e);
			U.Dom.addEvent(window, 'keydown', keydownHandler.current);
		}, 15);
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
	};

	const getValue = () => {
		const v = isSingleLine ? inputRef.current?.getValue() : inputRef.current?.getTextValue();
		return String(v || '').trim();
	};

	const onKeyDownHandler = (e: any) => {
		let ret = false;
		const hasActions = actions.length > 0;

		if (inputRef.current?.isFocused()) {
			if (hasActions) {
				keyboard.shortcut('arrowdown', e, () => {
					inputRef.current?.setBlur();
				});
			};

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

		if (!ret && hasActions) {
			onKeyDown(e);
		};
	};

	const onInput = (e: any, v: string) => {
		valueRef.current = isSingleLine ? String(v || '').trim() : getValue();
		position();
	};

	const save = () => {
		onChange?.(valueRef.current);
	};

	const beforePosition = () => {
		if (noResize) {
			return;
		};

		const obj = getContainer();
		const input = U.Dom.select('#input', obj);
		const { wh } = U.Dom.getWindowDimensions();
		const hh = J.Size.header;
		const cell = U.Dom.get(cellId);
		const nameEl = U.Dom.select('.name', cell) as HTMLElement;
		const lh = nameEl ? parseInt(window.getComputedStyle(nameEl).lineHeight, 10) || 20 : 20;
		const sh = input?.scrollHeight || 0;
		const height = Math.max(32, Math.min(wh - hh - 20, Math.max(cell?.offsetHeight || 0, sh)));

		U.Dom.css(obj, { height: `${height}px` });
		U.Dom.css(input, { lineHeight: `${lh}px` });
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
		U.Dom.addClass(inputWrapper.current as HTMLElement, 'focused');
	};

	const onBlur = () => {
		U.Dom.removeClass(inputWrapper.current as HTMLElement, 'focused');
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
		beforePosition,
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
						<Icon name="common/clear" withBackground={true} onClick={onClear} />
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

});

export default MenuDataviewText;