import * as React from 'react';

interface Props {
    id?: string;
    className?: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onStart?(e: React.MouseEvent<HTMLInputElement>, v: number): void;
    onChange?(e: React.ChangeEvent<HTMLInputElement>, v: number): void;
    onEnd?(e: React.MouseEvent<HTMLInputElement>, v: number): void;
}

const VerticalDrag: React.FC<Props> = ({
    id,
    className = '',
    value,
    min = 0,
    max = 1,
    step = 0.01,
    onStart,
    onChange,
    onEnd
}) => {
    const handleMouseDown = (e: React.MouseEvent<HTMLInputElement>) => {
        if (onStart) {
            onStart(e, Number(e.currentTarget.value));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e, Number(e.target.value));
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
        if (onEnd) {
            onEnd(e, Number(e.currentTarget.value));
        }
    };

    return (
        <div className={`input-vertical-drag ${className}`}>
            <input
                id={id}
                type="range"
                value={value}
                min={min}
                max={max}
                step={step}
                orient="vertical"
                onMouseDown={handleMouseDown}
                onChange={handleChange}
                onMouseUp={handleMouseUp}
            />
        </div>
    );
};

export default VerticalDrag;
