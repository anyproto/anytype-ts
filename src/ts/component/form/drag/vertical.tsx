import * as React from 'react';
import { useImperativeHandle, useRef } from 'react';
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

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		e.preventDefault();
		e.stopPropagation();

		if (onChange) {
			onChange(e, 1 - Number(e.target.value));
		};
	};

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
			<div className="slider-track" style={{ height: `${Math.round(value * 72)}px` }}></div>
		</div>
	);
});

export default DragVertical;