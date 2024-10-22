import * as React from 'react';
import { useEffect } from 'react';

interface Props {
    id?: string;
    className?: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange?(e: React.ChangeEvent<HTMLInputElement>, v: number): void;
}

const VerticalDrag = React.forwardRef<HTMLInputElement, Props>(({
    id,
    className = '',
    value,
    min = 0,
    max = 1,
    step = 0.01,
    onChange,
}, ref) => {

    const setBackgroundSize = () => {
        const el = (ref as React.RefObject<HTMLInputElement>)?.current;
        if (el) {
            const mn = min || 0;
            const mx = max || 100;
            const size = Math.round((value - mn) / (mx - mn) * 100);

            el.style.setProperty('--background-size', `${size}%`);
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
        className={`input-vertical-drag ${className}`}>
            <input
                ref={ref}
                type="range"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={handleChange}
                data-selection="off"
        />
        </div>
    );
});

export default VerticalDrag;
