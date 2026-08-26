import React, { FC, useRef } from 'react';
import Icon from 'Component/util/icon';
import IconObject from 'Component/util/iconObject';
import Label from 'Component/util/label';
import ObjectName from 'Component/util/object/name';

interface Props {
	rootId: string;
	route?: string;
};

/**
 * "Created in" eyebrow: a muted label followed by a clickable link to the object's
 * origin context (createdInContext). Rendered above the title on media and bookmark
 * pages — layouts that have no featured relations row. Does not render when the
 * object has no context or the context's details are unavailable.
 */
const ObjectCreatedIn: FC<Props> = ({
	rootId = '',
	route = '',
}) => {

	const nodeRef = useRef(null);
	const object = S.Detail.get(rootId, rootId, [ 'createdInContext', 'createdInContextRef' ]);
	const contextId = Relation.getStringValue(object.createdInContext);
	const context = contextId ? S.Detail.get(rootId, contextId, []) : null;

	if (!context || context._empty_ || context.isDeleted) {
		return null;
	};

	const name = U.Object.name(context, true);
	const cn = [ 'objectCreatedIn' ];

	const onClick = () => {
		U.Object.openCreatedInContext(object, route);
	};

	const onMouseEnter = () => {
		Preview.tooltipShow({
			text: Preview.tooltipCaption(U.String.htmlSpecialChars(name), translate('commonOpen')),
			element: nodeRef.current,
		});
	};

	const onMouseLeave = () => {
		Preview.tooltipHide(false);
	};

	return (
		<div className={cn.join(' ')}>
			<Label className="label" text={translate('objectCreatedInLabel')} />

			<div
				ref={nodeRef}
				className="item"
				onClick={onClick}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				<IconObject object={context} size={18} noClick={true} />
				<ObjectName object={context} withPlural={true} />
				<Icon name="arrow/upRight" className="arrow" size={16} />
			</div>
		</div>
	);

};

export default ObjectCreatedIn;
