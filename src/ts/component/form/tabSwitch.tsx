import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { I } from 'Lib';
import { Icon } from 'Component';

interface Props {
	id?: string;
	value: string;
	options: I.Option[];
	className?: string;
	readonly?: boolean;
	onChange? (v: any): void;
};

interface TabSwitchProps {
	getValue: () => any;
	setValue: (v: any) => void;
};

const TabSwitch = forwardRef<TabSwitchProps, Props>(({
	id = '',
	value: initialValue = '',
	options= [],
	className = '',
	readonly = false,
	onChange,
}, ref: any) => {

	const [ value, setValue ] = useState(initialValue);
	const cn = [ 'tabSwitch', className ];

	if (readonly) {
		cn.push('isReadonly');
	};

	const onChangeHandler = (e: any, v: any) => {
		if (readonly) {
			return;
		};

		setValue(v);
		if (onChange) {
			onChange(v);
		};
	};

	useImperativeHandle(ref, () => ({
		getValue: () => value,
		setValue,
	}));

	const optionWidth = 100 / options.length;
	const activeIdx = options.findIndex(option => option.id == value);

	return (
		<div id={id} className={cn.join(' ')}>
			{options.map((option, idx) => (
				<div
					key={idx}
					className={[ 'option', (option.id == value) ? 'active' : '' ].join(' ')}
					onClick={e => onChangeHandler(e, option.id)}
				>
					{option.icon ? <Icon className={option.icon} /> : ''}
					{option.name}
				</div>
			))}
			<div className="highlight" style={{ width: `${optionWidth}%`, left: `${optionWidth * activeIdx}%` }}></div>
		</div>
	);

});

export default TabSwitch;
