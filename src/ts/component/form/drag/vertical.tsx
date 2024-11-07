import * as React from 'react';
import { useEffect, useImperativeHandle, useRef } from 'react';
import { Input } from 'Component';

interface Props {
	id?: string;
	className?: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	onChange?(e: React.ChangeEvent<HTMLInputElement>, v: number): void;
	onMouseLeave?(e:any): void;
	onMouseEnter?(e:any): void;
}

function calcSize(min: number, max: number, value: number) {
	const mn = min || 0;
	const mx = max || 100;
	const size = Math.round((value - mn) / (mx - mn) * 100);
	return size;
}

const DragVertical = React.forwardRef<Input, Props>(({
	id,
	className = '',
	value,
	min = 0,
	max = 1,
	step = 0.01,
	onChange,
	onMouseLeave,
	onMouseEnter,
}, forwardedRef) => {
	const inputRef = useRef(null);
	const divRef = useRef(null);
	useImperativeHandle(forwardedRef, () => divRef.current);

	const setBackgroundSize = () => {
		if (inputRef) {
			const size = calcSize(min, max, value);
			inputRef.current?.node.style?.setProperty('--background-size', `${size}%`);
		}


	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (onChange) {
			onChange(e, 1 - Number(e.target.value));
		}
	};

	useEffect(() => { setBackgroundSize(); }, [value]);

	return (
		<div 
			id={id}
			ref={divRef}
			className={`input-drag-vertical ${className}`}
			onMouseLeave={onMouseLeave}
			onMouseEnter={onMouseEnter}
		>
			<Input
				type="range"
				className="vertical-range"
				ref={inputRef}
				value={String(value)}
				min={min}
				max={max}
				step={step}
				onChange={handleChange}
				onClick={e => {
					e.preventDefault();
					e.stopPropagation();
				}}
			/>
			<div className="slider-bg"></div>
			<div className="slider-track" style={{height: `${Math.round(value*72)}px`}}></div>
		</div>
	);
});

export default DragVertical;
