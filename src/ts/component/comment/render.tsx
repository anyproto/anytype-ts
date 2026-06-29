import React from 'react';
import { Icon } from 'Component';
import Attachment from 'Component/block/chat/attachment';
import CodeBlock from 'Component/util/codeBlock';
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
					withInlineSize={false}
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

		case I.TextStyle.Quote: {
			const sourceBlockId = part.editorQuote?.blockId || '';
			const sourceMessageId = part.messageQuote?.messageId || '';
			const isClickable = sourceBlockId || sourceMessageId;
			const cn = [ 'commentBlockquote', (isClickable ? 'isClickable' : '') ];
			const onQuoteClick = isClickable ? (() => {
				if (sourceBlockId) {
					U.Comment.scrollToBlock(sourceBlockId);
				} else
				if (sourceMessageId) {
					U.Comment.scrollToMessage(sourceMessageId);
				};
			}) : undefined;

			return (
				<div key={key} className="commentBlockquoteWrap">
					<blockquote
						className={cn.join(' ').trim()}
						data-block-id={sourceBlockId || undefined}
						data-message-id={sourceMessageId || undefined}
						onClick={onQuoteClick}
						dangerouslySetInnerHTML={{ __html: html }}
					/>
				</div>
			);
		};

		case I.TextStyle.Code:
			return <CodeBlock key={key} text={part.text || ''} lang={part.lang} className="commentCodeBlock" />;

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
					<Icon name={part.checked ? 'marker/checkbox2' : 'marker/checkbox0'} className="checkboxMark" />
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

			elements.push(<div key={`ulWrap-${i}`} className="commentListWrap"><ul className="commentList commentUl">{items}</ul></div>);
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

			elements.push(<div key={`olWrap-${i}`} className="commentListWrap"><ol className="commentList commentOl">{items}</ol></div>);
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

			elements.push(<div key={`checklistWrap-${i}`} className="commentListWrap"><div className="commentChecklist">{items}</div></div>);
			i = j;
			continue;
		};

		elements.push(renderPart(part, i, subId));
		i++;
	};

	return elements;
};

export { renderPart, renderParts };
