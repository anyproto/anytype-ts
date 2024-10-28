import * as React from 'react';
import { useEffect, useImperativeHandle, useRef } from 'react';
import Input from './input';

interface Props {
	id?: string;
	className?: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	onChange?(e: React.ChangeEvent<HTMLInputElement>, v: number): void;
	onMouseLeave?(e:any): void;
	onMouseMove?(e:any): void;
}

const VerticalDrag = React.forwardRef<Input, Props>(({
	id,
	className = '',
	value,
	min = 0,
	max = 1,
	step = 0.01,
	onChange,
	onMouseLeave,
	onMouseMove,
}, forwardedRef) => {
	const inputRef = useRef(null);
	const divRef = useRef(null);
	useImperativeHandle(forwardedRef, () => divRef.current);

	const setBackgroundSize = () => {
		if (inputRef) {
			const mn = min || 0;
			const mx = max || 100;
			const size = Math.round((value - mn) / (mx - mn) * 100);
			inputRef.current?.node.style?.setProperty('--background-size', `${size}%`);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (onChange) {
			onChange(e, Number(e.target.value));
		}
	};

	useEffect(()=>{
		setBackgroundSize();
	}, [value]);

	return (
		<div 
			id={id}
			ref={divRef}
			className={`input-vertical-drag ${className}`}
			onMouseLeave={onMouseLeave}
			onMouseMove={onMouseMove}
		>
			<Input
				type="range"
				ref={inputRef}
				value={String(value)}
				min={min}
				max={max}
				step={step}
				onChange={handleChange}
			/>
		</div>
	);
});

export default VerticalDrag;
