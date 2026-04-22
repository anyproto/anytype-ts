import React, { forwardRef, useState, useRef, useEffect } from 'react';
import * as Docs from 'Docs';
import { Cover, Button } from 'Component';
import Block from 'Component/block/help';
import ToggleBlock from 'Component/block/help/toggle';
import * as I from 'Interface';

const LIMIT = 1;

const PopupHelp = forwardRef<{}, I.Popup>((props, ref) => {

	const { getId, param } = props;
	const { data } = param;
	const [ page, setPage ] = useState(0);
	const nodeRef = useRef(null);
	const document = U.String.toUpperCamelCase(data.document);
	const f = Docs.Help[document];

	const blocks = 'function' == typeof f ? f() : f;
	const cover = blocks.find(it => it.type == I.BlockType.Cover);
	const isWhatsNew = document == 'WhatsNew';
	const cn = [ 'editor', 'help' ];

	if (cover) {
		cn.push('withCover');
	};

	const keydownHandler = useRef<(e: any) => void>(null);

	const rebind = () => {
		unbind();
		keydownHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
	};

	const onKeyDown = (e: any) => {
		const cmd = keyboard.cmdKey();

		keyboard.shortcut(`${cmd}+c`, e, () => {
			e.stopPropagation();
		});
	};

	const getSections = (): any[] => {
		const list = blocks.filter(it => it.type != I.BlockType.Cover);
		const sections: any[] = [];

		switch (document) {
			default: {
				sections.push({ children: list });
				break;
			};

			case 'WhatsNew': {
				let section = { children: [], header: null };
				for (const block of list) {
					if (!section.header && [ I.TextStyle.Title, I.TextStyle.Header1, I.TextStyle.Header2, I.TextStyle.Header3, I.TextStyle.ToggleHeader1, I.TextStyle.ToggleHeader2, I.TextStyle.ToggleHeader3 ].includes(block.style)) {
						section.header = block;
					};

					section.children.push(block);

					if (block.type == I.BlockType.Div) {
						sections.push(section);
						section = { children: [], header: null };
					};
				};
				break;
			};
		};

		return sections;
	};

	let sections = getSections();

	const length = sections.length;

	if (isWhatsNew) {
		sections = sections.slice(page, page + LIMIT);
	};

	const onArrow = (dir: number) => {
		if ((page + dir < 0) || (page + dir >= length)) {
			return;
		};

		const obj = U.Dom.get(`${getId()}-innerWrap`);
		if (obj) {
			obj.scrollTop = 0;
		};

		setPage(page + dir);
	};

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	useEffect(() => {
		U.Dom.renderLinks(nodeRef.current);
	});

	return (
		<div 
			ref={nodeRef}
			className="wrapper"
		>
			<div className={cn.join(' ')}>
				{cover ? <Cover {...cover.param} /> : ''}

				<div className="blocks">
					{sections.map((section: any, i: number) => (
						<div key={i} className="section">
							{section.children.map((child: any, i: number) => (
								child.style === I.TextStyle.Toggle
									? <ToggleBlock key={i} block={child} blockProps={props} />
									: <Block key={i} {...props} {...child} />
							))}
						</div>
					))}
				</div>

				{isWhatsNew ? (
					<div className="buttons">
						{page < length - 1 ? <Button size={28} text={translate('popupHelpPrevious')} onClick={() => onArrow(1)} /> : ''}
						{page > 0 ? <Button size={28} text={translate('popupHelpNext')} onClick={() => onArrow(-1)} /> : ''}
					</div>
				) : ''}
			</div>
		</div>
	);

});

export default PopupHelp;