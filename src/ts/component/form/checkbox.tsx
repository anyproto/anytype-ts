import React, { forwardRef, useState, useEffect, useImperativeHandle } from 'react';

interface Props {
	id?: string;
	value: boolean;
	className?: string;
	readonly?: boolean;
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
}, ref: any) => {

	const [ value, setValue ] = useState(false);
	const cn = [ 'icon', 'checkbox', className ];

	if (readonly) {
		cn.push('isReadonly');
	};
	if (value) {
		cn.push('active');
	};

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
	
	useEffect(() => setValue(initialValue), []);
	
	return (
		<div
			id={id}
			className={cn.join(' ')}
			onClick={onChangeHandler}
		/>
	);

});

export default Checkbox;