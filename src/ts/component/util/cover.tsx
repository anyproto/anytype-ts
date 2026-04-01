import React, { forwardRef, ReactNode, MouseEvent, CSSProperties, useRef, useEffect, useState, useCallback } from 'react';
import * as I from 'Interface';

interface Props {
	id?: string;
	image?: string;
	src?: string;
	className?: string;
	type?: number;
	x?: number;
	y?: number;
	scale?: number;
	withScale?: boolean;
	children?: ReactNode;
	onClick?(e: MouseEvent<HTMLDivElement>): void;
	onMouseDown?(e: MouseEvent<HTMLDivElement>): void;
};

const Cover = forwardRef<HTMLDivElement, Props>(({
	id = '',
	image = '',
	src = '',
	type = 0,
	x = 0,
	y = 0,
	scale = 0,
	withScale = false,
	className = '',
	onClick,
	onMouseDown,
	children,
}, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);
	const cacheRef = useRef<{ url: string; width: number; height: number } | null>(null);
	const [ bgStyle, setBgStyle ] = useState<CSSProperties>({});

	const setRef = useCallback((node: HTMLDivElement) => {
		nodeRef.current = node;
		if (typeof ref === 'function') {
			ref(node);
		} else
		if (ref) {
			ref.current = node;
		};
	}, [ ref ]);

	useEffect(() => {
		const isImage = [ I.CoverType.Upload, I.CoverType.Source ].includes(type);

		if (!withScale || !isImage) {
			setBgStyle({});
			return;
		};

		const imgUrl = src || (image ? S.Common.imageUrl(image, I.ImageSize.Large) : '');
		const node = nodeRef.current;

		if (!imgUrl || !node) {
			setBgStyle({});
			return;
		};

		const apply = (nw: number, nh: number) => {
			const node = nodeRef.current;
			if (!node) {
				return;
			};

			const cw = node.offsetWidth;
			const ch = node.offsetHeight;

			if (!cw || !ch) {
				return;
			};

			// Ensure image covers the container (like background-size: cover)
			const coverScale = Math.max(cw / nw, ch / nh);
			const userScale = cw * (scale + 1) / nw;
			const effectiveScale = Math.max(coverScale, userScale);

			const bw = nw * effectiveScale;
			const bh = nh * effectiveScale;

			// x, y are negative offset ratios from BlockCover's translate coordinate system
			// Use percentage-based positioning which naturally adapts to different container sizes
			// by aligning the P% point of the image with the P% point of the container
			const px = Math.abs(x) * 100;
			const py = Math.abs(y) * 100;

			setBgStyle({
				backgroundSize: `${bw}px ${bh}px`,
				backgroundPosition: `${px}% ${py}%`,
			});
		};

		const compute = () => {
			if ((cacheRef.current?.url === imgUrl)) {
				apply(cacheRef.current.width, cacheRef.current.height);
			} else {
				const img = new Image();
				img.onload = () => {
					cacheRef.current = { url: imgUrl, width: img.naturalWidth, height: img.naturalHeight };
					apply(img.naturalWidth, img.naturalHeight);
				};
				img.src = imgUrl;
			};
		};

		compute();

		const observer = new ResizeObserver(() => compute());
		observer.observe(node);

		return () => observer.disconnect();
	}, [ withScale, type, image, src, x, y, scale ]);

	const cn = [ 'cover', `type${type}`, id, className ];
	const style: CSSProperties = {};

	if ([ I.CoverType.Upload, I.CoverType.Source ].includes(type) && image) {
		style.backgroundImage = `url("${S.Common.imageUrl(image, I.ImageSize.Large)}")`;
	};

	if (src) {
		style.backgroundImage = `url("${src}")`;
	};

	Object.assign(style, bgStyle);

	return (
		<div
			ref={setRef}
			className={cn.join(' ')}
			onClick={onClick}
			onMouseDown={onMouseDown}
			style={style}>
			{children}
		</div>
	);
});

export default Cover;
