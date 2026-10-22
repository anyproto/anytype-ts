import React from 'react';
import WidgetTree from './index';
import useCreatedTreeSource from './source/created';
import * as I from 'Interface';

interface Props {
	block: I.Block; // synthetic section block, its id keys the toggles and subscriptions
	sidebarDirection?: I.SidebarDirection;
};

/**
 * The Tree sidebar section: the created-in hierarchy of the space, drawn by the tree widget.
 * It is mounted only while the section is open, so its subscriptions live exactly that long.
 */
const WidgetTreeSection = (props: Props) => {

	const { block, sidebarDirection } = props;
	const { treeSortMode, treeShowBookmarks } = S.Common;
	const source = useCreatedTreeSource({ sort: treeSortMode, showBookmarks: treeShowBookmarks });
	const cn = [ 'widget', 'widgetTree', 'isSidebarSection' ];

	return (
		<div id={`widget-${block.id}`} className={cn.join(' ')}>
			<div id="wrapper" className="contentWrapper">
				<WidgetTree
					parent={block}
					block={block}
					source={source}
					isSidebarSection={true}
					emptyText={translate('widgetTreeEmpty')}
					sidebarDirection={sidebarDirection}
					onContext={param => U.Menu.widgetObjectContext(param)}
				/>
			</div>
		</div>
	);

};

export default WidgetTreeSection;
