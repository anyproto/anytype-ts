import React, { forwardRef, useRef, useEffect } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Editable } from 'Component';
import { I, J, U } from 'Lib';

const MenuDataviewText = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	
	const { param, getId, position } = props;
	const { data } = param;
	const { value, placeholder, canEdit, noResize, cellId, onChange } = data;
	const nodeRef = useRef(null);
	const length = value.length;
	const valueRef = useRef(value);

	useEffect(() => {
		if (nodeRef.current) {
			nodeRef.current.setValue(U.Common.htmlSpecialChars(value));
			nodeRef.current.setRange({ from: length, to: length });
			nodeRef.current.placeholderCheck();
		};

		resize();

		return () => {
			save();
		};
	});

	const getValue = () => {
		return String(nodeRef.current?.getTextValue() || '').trim();
	};

	const onInput = () => {
		valueRef.current = getValue();
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

	return (
		<Editable
			ref={nodeRef}
			id="input"
			placeholder={placeholder}
			readonly={!canEdit}
			onInput={onInput}
			onPaste={onInput}
		/>
	);

}));

export default MenuDataviewText;