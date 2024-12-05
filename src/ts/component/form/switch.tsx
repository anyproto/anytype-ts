import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';

interface Props {
	id?: string;
	value?: boolean;
	color?: string;
	className?: string;
	readonly?: boolean;
	onChange?(e: any, value: boolean): void;
};

interface SwitchRefProps {
	getValue (): boolean;
	setValue (value: boolean): void;
};

const Switch = forwardRef<SwitchRefProps, Props>(({
	id = '',
	value: initialValue = false,
	color = 'orange',
	className = '',
	readonly = false,
	onChange,
}, ref: any) => {
	
	const nodeRef = useRef(null);
	const [ value, setValue ] = useState(initialValue);
	const cn = [ 'switch', color, className ];

	if (value) {
		cn.push('active');
	};
	if (readonly) {
		cn.push('isReadonly');
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

	useEffect(() => setValue(initialValue), []);

	useImperativeHandle(ref, () => ({
		getValue: () => value,
		setValue: (value: boolean) => setValue(value),
	}));
	
	return (
		<div 
			ref={nodeRef}
			id={id} 
			className={cn.join(' ')} 
			onClick={onChangeHandler}
		>
			<div className="inner" />
		</div>
	);

});

export default Switch;