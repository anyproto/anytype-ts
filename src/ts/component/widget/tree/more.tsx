import React, { MouseEvent } from 'react';
import { Label } from 'Component';
import { getTreePaddingLeft } from './item';
import * as I from 'Interface';

interface Props extends I.WidgetTreeItem {
	treeKey: string;
	style?: any;
	onMore: (e: MouseEvent, node: I.WidgetTreeItem) => void;
};

/**
 * The "Show more" row closing a paged list of tree nodes.
 */
const TreeItemMore = (props: Props) => {

	const { treeKey, depth, style, onMore } = props;
	const paddingLeft = getTreePaddingLeft(depth);

	const onMouseDown = (e: MouseEvent) => {
		if (U.Common.checkAuxButton(e)) {
			return;
		};

		onMore(e, props);
	};

	const onContextMenu = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	return (
		<div id={treeKey} className="item isMore" style={style} onContextMenu={onContextMenu}>
			<div className="inner" style={{ paddingLeft }}>
				<div className="clickable" onMouseDown={onMouseDown}>
					<div className="arrowWrap" />
					<Label className="name" text={translate('commonShowMore')} />
				</div>
			</div>
		</div>
	);

};

export default TreeItemMore;
