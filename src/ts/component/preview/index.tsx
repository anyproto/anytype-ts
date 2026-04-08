import React, { forwardRef, useState, useEffect, useRef, MouseEvent } from 'react';
import { PreviewLink, PreviewObject, PreviewDefault, PreviewTab } from 'Component';
import * as I from 'Interface';

const OFFSET_Y = 8;
const BORDER = 12;

const PreviewIndex = forwardRef(() => {

	const nodeRef = useRef(null);
	const polygonRef = useRef(null);
	const { preview } = S.Common;
	const { type, markType, target, object: initialObject, marks, range, noUnlink, noEdit, x, y, width, height, onChange, withPlural, classNameWrap } = preview;
	const [ object, setObject ] = useState(null);
	const cn = [ 'previewWrapper' ];

	if (classNameWrap) {
		cn.push(classNameWrap);
	};

	const onClick = (e: MouseEvent) => {
		if (U.Common.checkAuxButton(e)) {
			return;
		};

		switch (type) {
			case I.PreviewType.Link: {
				const route = U.Common.getRouteFromUrl(target);

				if (route) {
					const routeParam = U.Router.getParam(route);

					if (routeParam.id && routeParam.spaceId) {
						U.Object.getById(routeParam.id, { spaceId: routeParam.spaceId }, (obj) => {
							obj ? U.Object.openConfig(e, obj) : Action.openUrl(target);
						});
						break;
					};
				};

				Action.openUrl(target);
				break;
			};

			case I.PreviewType.Default:
			case I.PreviewType.Object: {
				U.Object.openConfig(e, object);
				break;
			};
		};
	};
	
	const onCopy = () => {
		U.Common.copyToast(translate('commonLink'), target);
		Preview.previewHide(true);
	};
	
	const onEdit = (e) => {
		e.preventDefault();
		e.stopPropagation();

		const mark = Mark.getInRange(marks, markType, range);
		const previewEl = U.Dom.get('preview');
		const domRect = previewEl?.getBoundingClientRect();
		const rect = domRect ? U.Common.objectCopy(domRect) : null;

		S.Menu.open('blockLink', {
			classNameWrap: 'fromBlock',
			rect: rect ? { ...rect, height: 0, y: rect.y + window.scrollY } : null,
			horizontal: I.MenuDirection.Center,
			onOpen: () => Preview.previewHide(true),
			data: {
				filter: mark ? mark.param : '',
				type: mark ? mark.type : null,
				onChange: (type: I.MarkType, param: string) => {
					onChange(Mark.toggleLink({ type, param, range }, marks));
				}
			}
		});
	};
	
	const onUnlink = () => {
		onChange(Mark.toggleLink({ type: markType, param: '', range }, preview.marks));
		Preview.previewHide(true);
	};

	const onMouseDown = (e: MouseEvent) => {
		if (e.button === 2) {
			const el = U.Dom.get('preview');
			if (el) {
				U.Dom.css(el, { display: 'none' });
			};
			Preview.previewHide(true);
		};
	};

	useEffect(() => {
		const handler = (e: any) => {
			if (e.button === 2) {
				const previewEl = U.Dom.get('preview');
				if (previewEl && previewEl.contains(e.target)) {
					U.Dom.css(previewEl, { display: 'none' });
					Preview.previewHide(true);
				};
			};
		};

		U.Dom.addEvent(document, 'mousedown', handler, true);
		return () => U.Dom.removeEvent(document, 'mousedown', handler, true);
	}, []);

	const position = () => {
		const node = nodeRef.current as HTMLElement;
		const poly = polygonRef.current as HTMLElement;
		if (!node || !poly) {
			return;
		};

		// Make visible before measuring so offsetWidth/offsetHeight return real values
		U.Dom.css(node, { display: 'block', opacity: '0' });

		const { ww, wh } = U.Dom.getWindowDimensions();
		const st = window.scrollY;
		const ow = node.offsetWidth;
		const oh = node.offsetHeight;
		const offsetY = preview.noOffset ? 0 : OFFSET_Y;
		let cssLeft = 0;
		let cssTop = 0;
		let cssTransform = '';
		const pcss: any = { top: 'auto', bottom: 'auto', width: '', left: '', height: `${height + offsetY}px`, clipPath: '' };
		const vsTop = (1 - height / oh) / 2 * 100;
		const vsBot = (1 + height / oh) / 2 * 100;

		let typeY = I.MenuDirection.Bottom;
		let ps = (1 - width / ow) / 2 * 100;
		let pe = ps + width / ow * 100;

		let cpTop = `polygon(0% 0%, ${ps}% ${vsTop}%, ${ps}% 100%, ${pe}% 100%, ${pe}% ${vsTop}%, 100% 0%)`;
		let cpBot = `polygon(0% 100%, ${ps}% ${vsBot}%, ${ps}% 0%, ${pe}% 0%, ${pe}% ${vsBot}%, 100% 100%)`;

		if (ow < width) {
			pcss.width = `${width}px`;
			pcss.left = `${(ow - width) / 2}px`;
			ps = (width - ow) / width / 2 * 100;
			pe = (1 - (width - ow) / width / 2) * 100;

			cpTop = `polygon(0% 100%, ${ps}% 0%, ${pe}% 0%, 100% 100%)`;
			cpBot = `polygon(0% 0%, ${ps}% 100%, ${pe}% 100%, 100% 0%)`;
		};

		if (y + oh + height >= st + wh) {
			typeY = I.MenuDirection.Top;
		};

		if (typeY == I.MenuDirection.Top) {
			cssTop = y - oh - offsetY;
			cssTransform = 'translateY(-5%)';

			pcss.bottom = `${-height - offsetY}px`;
			pcss.clipPath = cpTop;
		};

		if (typeY == I.MenuDirection.Bottom) {
			cssTop = y + height + offsetY;
			cssTransform = 'translateY(5%)';

			pcss.top = `${-height - offsetY}px`;
			pcss.clipPath = cpBot;
		};

		switch (preview.typeX) {
			default:
			case I.MenuDirection.Center: {
				cssLeft = x - ow / 2 + width / 2;
				break;
			};

			case I.MenuDirection.Left: {
				cssLeft = x;
				break;
			};

			case I.MenuDirection.Right: {
				cssLeft = x + width - ow;
				break;
			};
		};

		cssLeft = Math.max(BORDER, cssLeft);
		cssLeft = Math.min(ww - ow - BORDER, cssLeft);

		U.Dom.css(node, { left: `${cssLeft}px`, top: `${cssTop}px`, transform: cssTransform });

		if (!preview.noAnimation) {
			U.Dom.addClass(node, 'anim');
		};

		U.Dom.css(poly, pcss);
		window.setTimeout(() => { U.Dom.css(node, { opacity: '1', transform: 'translateY(0%)' }); }, 15);
	};

	let head = null;
	let content = null;

	const unlink = <div id="button-unlink" className="item" onClick={onUnlink}>{translate('commonUnlink')}</div>;
	const props = {
		rootId: target,
		url: target,
		object,
		size: I.PreviewSize.Small,
		setObject,
		position,
		withPlural,
	};

	switch (type) {
		case I.PreviewType.Link: {
			head = (
				<div className="head">
					<div id="button-copy" className="item" onClick={onCopy}>{translate('commonCopyLink')}</div>
					{!noEdit ? <div id="button-edit" className="item" onClick={onEdit}>{translate('previewEdit')}</div> : ''}
					{!noUnlink ? unlink : ''}
				</div>
			);

			content = <PreviewLink {...props} />;
			break;
		};

		case I.PreviewType.Object: {
			if (!noUnlink) {
				head = <div className="head">{unlink}</div>;
			};

			content = <PreviewObject {...props} />;
			break;
		};

		case I.PreviewType.Default: {
			if (!noUnlink) {
				head = <div className="head">{unlink}</div>;
			};

			content = <PreviewDefault {...props} />;
			break;
		};

		case I.PreviewType.Tab: {
			content = <PreviewTab spaceview={initialObject} data={preview.relatedData} position={position} />;
			break;
		};
	};

	if (head) {
		cn.push('withHead');
	};

	useEffect(() => {
		if (initialObject) {
			setObject(initialObject);
		};

		position();
	}, [ type ]);

	return content ? (
		<div
			ref={nodeRef}
			id="preview"
			className={cn.join(' ')}
			onMouseEnter={() => Preview.previewCancelHide()}
			onMouseLeave={() => Preview.previewHide(true)}
			onMouseDown={onMouseDown}
		>
			<div ref={polygonRef} className="polygon" onClick={onClick} onMouseDown={onMouseDown} />
			<div className="content">
				{head}

				<div onClick={onClick}>{content}</div>
			</div>
		</div>
	) : null;

});

export default PreviewIndex;
