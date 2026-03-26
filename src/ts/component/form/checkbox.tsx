import React, { forwardRef, useState, useEffect, useImperativeHandle } from 'react';
import { Icon } from 'Component';

interface Props {
	id?: string;
	value: boolean;
	className?: string;
	readonly?: boolean;
	size?: number;
	onChange?(e: any, value: boolean): void;
};

interface CheckboxRefProps {
	getValue: () => boolean;
	setValue: (v: boolean) => void;
	toggle: () => void;
};

const Checkbox = forwardRef<CheckboxRefProps, Props>(({
	id = '',
	value: initialValue = false,
	className = '',
	readonly = false,
	onChange,
	size,
}, ref: any) => {

	const [ value, setValue ] = useState(false);

	const onChangeHandler = (e: any) => {
		if (readonly) {
			return;
		};

		setValue(!value);
		if (onChange) {
			onChange(e, !value);
		};
	};

	useImperativeHandle(ref, () => ({
		getValue: () => value,
		setValue,
		toggle: () => setValue(!value)
	}));

	useEffect(() => setValue(initialValue), [ initialValue ]);

	return (
		<Icon
			id={id}
			name={value ? 'object/checkbox2' : 'object/checkbox0'}
			size={size}
			className={[ 'checkbox', (readonly ? 'isReadonly' : ''), className ].join(' ')}
			onClick={onChangeHandler}
		/>
	);

});

export default Checkbox;
