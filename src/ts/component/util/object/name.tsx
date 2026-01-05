import React, { FC, MouseEvent } from 'react';
import { Icon } from 'Component';
import { U, S, translate, Action, analytics } from 'Lib';

interface Props {
	object: any;
	className?: string;
	withLatex?: boolean;
	withPlural?: boolean;
	withPronoun?: boolean;
	withBadge?: boolean;
	onClick? (e: MouseEvent): void;
	onMouseDown? (e: MouseEvent): void;
	onMouseEnter? (e: MouseEvent): void;
	onMouseLeave? (e: MouseEvent): void;
};

const ObjectName: FC<Props> = ({
	object = {},
	className = 'name',
	withLatex = false,
	withPlural = false,
	withPronoun = false,
	withBadge = false,
	onClick,
	onMouseDown,
	onMouseEnter,
	onMouseLeave,
}) => {
	object = object || {};

	const { layout, snippet, isDeleted, globalName } = object;

	let name = String(object.name || '');
	let empty = null;
	let latex = null;
	let content = null;
	let you = null;
	let badge = null;

	const onBadgeClick = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const participant = U.Space.getParticipant();

		if (participant.globalName) {
			return;
		};

		S.Popup.open('confirm', {
			className: 'anyId',
			data: {
				icon: 'anyId',
				title: translate('membershipUpsellAnyIdTitle'),
				text: translate('membershipUpsellAnyIdText'),
				textConfirm: translate('membershipUpsellAnyIdExplorePlans'),
				colorConfirm: 'blank',
				onConfirm: () => {
					Action.openSettings('membership', analytics.route.menuParticipant);
				},
				canCancel: false
			}
		});
	};

	if (!isDeleted) {
		if (U.Object.isNoteLayout(layout)) {
			name = snippet;
		} else {
			name = U.Object.name(object, withPlural);
		};

		if (withLatex) {
			latex = U.Common.getLatex(name);
		};

		if (withBadge && U.Object.isParticipantLayout(layout)) {
			badge = globalName ? <Icon className="badge" onClick={onBadgeClick} /> : '';
		};
	};

	if (!name) {
		empty = <span className="empty">{translate('commonEmpty')}</span>;
	};
	if (withPronoun) {
		you = <span className="you"> ({translate('commonYou')})</span>;
	};

	if (!empty && !latex) {
		content = <span>{name}{you}</span>;
	};

	return (
		<div 
			className={className} 
			onClick={onClick}
			onMouseDown={onMouseDown}
			onMouseEnter={onMouseEnter} 
			onMouseLeave={onMouseLeave}
		>
			{empty}
			{latex}
			{content}
			{badge}
		</div>
	);

};

export default ObjectName;
