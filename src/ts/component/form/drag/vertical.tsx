import React, { useRef, useImperativeHandle, forwardRef, ChangeEvent } from 'react';
import { Input } from 'Component';

interface Props {
	id?: string;
	className?: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	onChange?(e: ChangeEvent<HTMLInputElement>, v: number): void;
	onMouseLeave?(e:any): void;
	onMouseEnter?(e:any): void;
};

const DragVertical = forwardRef<{}, Props>(({
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

	const handleChange = (e: ChangeEvent<HTMLInputElement>, value: string) => {
		e.preventDefault();
		e.stopPropagation();

		if (onChange) {
			onChange(e, 1 - Number(value) || 0);
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
			<div className="slider-bg" />
			<div className="slider-track" style={{ height: `${Math.round(value * 72)}px` }} />
		</div>
	);
});

export default DragVertical;