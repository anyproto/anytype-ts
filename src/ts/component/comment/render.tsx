import React from 'react';
import * as Prism from 'prismjs';
import Attachment from 'Component/block/chat/attachment';
import EmbedPreview from './embedPreview';
import * as I from 'Interface';

const renderPart = (part: I.CommentContentPart, index: number, subId?: string): JSX.Element => {
	const key = `part-${index}`;

	// Divider
	if (part.type === I.BlockType.Div) {
		return <hr key={key} className="commentDivider" />;
	};

	// Embed
	if ((part.type === I.BlockType.Embed) && part.embed) {
		return (
			<EmbedPreview
				key={key}
				processor={part.embed.processor}
				text={part.embed.text}
			/>
		);
	};

	// Link (attachment)
	if ((part.type === I.BlockType.Link) && part.link) {
		const object = subId ? S.Detail.get(subId, part.link.targetObjectId) : null;
		if (!object || object._empty_) {
			return <React.Fragment key={key} />;
		};

		return (
			<div key={key} className="commentAttachments">
				<Attachment
					object={object}
					subId={subId}
					onRemove={() => {}}
				/>
			</div>
		);
	};

	const html = U.String.sanitize(Mark.toHtml(part.text || '', part.marks || []));

	switch (part.style) {
		case I.TextStyle.Header1:
			return <h1 key={key} className="commentH1" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Header2:
			return <h2 key={key} className="commentH2" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Header3:
			return <h3 key={key} className="commentH3" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Quote:
			return <blockquote key={key} className="commentBlockquote" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Code: {
			const lang = part.lang || 'plain';
			const grammar = Prism.languages[lang];
			const text = part.text || '';
			const highlighted = grammar ? Prism.highlight(text, grammar, lang) : U.String.sanitize(text);
			const titles = U.Prism.getTitles();
			const langTitle = titles.find((t: any) => t.id === lang);
			const langLabel = langTitle ? langTitle.name : (lang !== 'plain' ? lang : '');

			return (
				<pre key={key} className="commentCodeBlock">
					{langLabel ? <div className="codeLang">{langLabel}</div> : null}
					<code dangerouslySetInnerHTML={{ __html: highlighted }} />
				</pre>
			);
		}

		case I.TextStyle.Bulleted:
			return <div key={key} className="commentListItem commentBulleted" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Numbered:
			return <div key={key} className="commentListItem commentNumbered" dangerouslySetInnerHTML={{ __html: html }} />;

		case I.TextStyle.Checkbox: {
			const cn = [ 'commentListItem', 'commentCheckbox' ];
			if (part.checked) {
				cn.push('isChecked');
			};
			return (
				<div key={key} className={cn.join(' ')}>
					<div className="checkboxMark" />
					<span dangerouslySetInnerHTML={{ __html: html }} />
				</div>
			);
		};

		default:
			return <p key={key} className="commentParagraph" dangerouslySetInnerHTML={{ __html: html }} />;
	};
};

const renderParts = (parts: I.CommentContentPart[], subId?: string): JSX.Element[] => {
	const elements: JSX.Element[] = [];
	let i = 0;

	while (i < parts.length) {
		const part = parts[i];

		// Group consecutive bulleted items
		if (part.style === I.TextStyle.Bulleted) {
			const items: JSX.Element[] = [];
			let j = i;

			while ((j < parts.length) && (parts[j].style === I.TextStyle.Bulleted)) {
				const html = U.String.sanitize(Mark.toHtml(parts[j].text || '', parts[j].marks || []));
				items.push(<li key={`li-${j}`} dangerouslySetInnerHTML={{ __html: html }} />);
				j++;
			};

			elements.push(<ul key={`ul-${i}`} className="commentList commentUl">{items}</ul>);
			i = j;
			continue;
		};

		// Group consecutive numbered items
		if (part.style === I.TextStyle.Numbered) {
			const items: JSX.Element[] = [];
			let j = i;

			while ((j < parts.length) && (parts[j].style === I.TextStyle.Numbered)) {
				const html = U.String.sanitize(Mark.toHtml(parts[j].text || '', parts[j].marks || []));
				items.push(<li key={`li-${j}`} dangerouslySetInnerHTML={{ __html: html }} />);
				j++;
			};

			elements.push(<ol key={`ol-${i}`} className="commentList commentOl">{items}</ol>);
			i = j;
			continue;
		};

		// Group consecutive checkbox items
		if (part.style === I.TextStyle.Checkbox) {
			const items: JSX.Element[] = [];
			let j = i;

			while ((j < parts.length) && (parts[j].style === I.TextStyle.Checkbox)) {
				items.push(renderPart(parts[j], j, subId));
				j++;
			};

			elements.push(<div key={`checklist-${i}`} className="commentChecklist">{items}</div>);
			i = j;
			continue;
		};

		elements.push(renderPart(part, i, subId));
		i++;
	};

	return elements;
};

export { renderPart, renderParts };
