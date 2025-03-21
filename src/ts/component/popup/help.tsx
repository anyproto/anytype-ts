import React, { forwardRef, useState, useRef, useEffect } from 'react';
import $ from 'jquery';
import * as Docs from 'Docs';
import { Label, Icon, Cover, Button } from 'Component';
import { I, U, J, translate, Action } from 'Lib';
import Block from 'Component/block/help';

const LIMIT = 1;

const PopupHelp = forwardRef<{}, I.Popup>((props, ref) => {

	const { getId, param } = props;
	const { data } = param;
	const [ page, setPage ] = useState(0);
	const nodeRef = useRef(null);
	const document = U.Common.toUpperCamelCase(data.document);
	const blocks = Docs.Help[document] || [];
	const title = blocks.find(it => it.style == I.TextStyle.Title);
	const cover = blocks.find(it => it.type == I.BlockType.Cover);
	const isWhatsNew = document == 'WhatsNew';
	const cn = [ 'editor', 'help' ];

	if (cover) {
		cn.push('withCover');
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
					if (!section.header && [ I.TextStyle.Title, I.TextStyle.Header1, I.TextStyle.Header2, I.TextStyle.Header3 ].includes(block.style)) {
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
		const obj = $(`#${getId()}-innerWrap`);

		if ((page + dir < 0) || (page + dir >= length)) {
			return;
		};

		obj.scrollTop(0);
		setPage(page + dir);
	};

	useEffect(() => U.Common.renderLinks($(nodeRef.current)));

	return (
		<div 
			ref={nodeRef}
			className="wrapper"
		>
			<div className="head">
				<div className="side left">
					{title ? <Label text={title.text} /> : ''}
				</div>
				<div className="side right">
					<Label text={translate('popupHelpLabel')} />
					<Icon onClick={() => Action.openUrl(J.Url.mail)} className="mail" />
				</div>
			</div>
			
			<div className={cn.join(' ')}>
				{cover ? <Cover {...cover.param} /> : ''}

				<div className="blocks">
					{sections.map((section: any, i: number) => (
						<div key={i} className="section">
							{section.children.map((child: any, i: number) => <Block key={i} {...props} {...child} />)}
						</div>
					))}
				</div>

				{isWhatsNew ? (
					<div className="buttons">
						{page < length - 1 ? <Button className="c28" text={translate('popupHelpPrevious')} onClick={() => onArrow(1)} /> : ''}
						{page > 0 ? <Button className="c28" text={translate('popupHelpNext')} onClick={() => onArrow(-1)} /> : ''}
					</div>
				) : ''}
			</div>
		</div>
	);

});

export default PopupHelp;