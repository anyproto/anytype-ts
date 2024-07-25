import * as React from 'react';
import { observer } from 'mobx-react';
import { DropTarget, Icon, IconObject, ObjectName, Label } from 'Component';
import { I, S, U, J, keyboard, Storage, translate } from 'Lib';

interface Props extends I.WidgetTreeItem {
	index: number;
	treeKey: string;
	style?: any;
	isEditing?: boolean;
	isSection?: boolean;
	onClick?(e: React.MouseEvent, props): void;
	onToggle?(e: React.MouseEvent, props): void;
	setActive?(id: string): void;
	getSubId?(id: string): string;
	getSubKey?(): string;
	onContext?(param: any): void;
};

const TreeItem = observer(class Node extends React.Component<Props> { 
		
	node = null;

	constructor (props: Props) {
		super(props);

		this.onToggle = this.onToggle.bind(this);
	};

	render () {
		const { id, parentId, treeKey, depth, style, numChildren, isEditing, onClick, isSection, getSubKey, getSubId } = this.props;
		const subKey = getSubKey();
		const subId = getSubId(parentId);
		const isOpen = Storage.checkToggle(subKey, treeKey);
		const object = S.Detail.get(subId, id, J.Relation.sidebar);
		const { isReadonly, isArchived, type, restrictions, done, layout } = object;
		const cn = [ 'item', 'c' + id, (isOpen ? 'isOpen' : '') ];
		const rootId = keyboard.getRootId();
		const canDrop = !isEditing && S.Block.isAllowed(restrictions, [ I.RestrictionObject.Block ]);
		const allowedDetails = S.Block.isAllowed(restrictions, [ I.RestrictionObject.Details ]);
		const paddingLeft = depth > 1 ? (depth - 1) * 8 : 4;
		const hasMore = U.Space.canMyParticipantWrite();

		let arrow = null;
		let onArrowClick = null;
		let more = null;

		if (isSection) {
			cn.push('isSection');

			return (
				<div
					ref={node => this.node = node}
					style={style}
					id={treeKey}
					className={cn.join(' ')}
				>
					<div className="inner">
						<Label text={translate(U.Common.toCamelCase([ 'common', id ].join('-')))} />
					</div>
				</div>
			);
		};

		if (U.Object.isCollectionLayout(layout) && !numChildren) {
			arrow = <Icon className="set" />;
		} else
		if (!U.Object.isCollectionLayout(layout) && U.Object.isInSetLayouts(layout)) {
			arrow = <Icon className="set" />;
		} else
		if (numChildren > 0) {
			onArrowClick = this.onToggle;
			arrow = <Icon className="arrow" />;
		} else {
			arrow = <Icon className="blank" />;
		};

		if (arrow) {
			arrow = <div className="arrowWrap" onMouseDown={onArrowClick}>{arrow}</div>;
		};

		if (hasMore) {
			more = <Icon className="more" tooltip={translate('widgetOptions')} onMouseDown={e => this.onContext(e, true)} />;
		};

		let inner = (
			<div className="inner" style={{ paddingLeft }}>
				<div
					className="clickable"
					onMouseDown={e => onClick(e, object)}
				>
					{arrow}
					<IconObject 
						id={`widget-icon-${treeKey}`}
						object={object} 
						size={20} 
						canEdit={!isReadonly && !isArchived && allowedDetails && U.Object.isTaskLayout(object.layout)} 
						menuParam={{ 
							className: 'fixed',
							classNameWrap: 'fromSidebar',
						}}
					/>
					<ObjectName object={object} />
				</div>

				<div className="buttons">
					{more}
				</div>
			</div>
		);

		if (canDrop) {
			inner = (
				<DropTarget
					cacheKey={treeKey}
					id={object.id}
					rootId={rootId}
					targetContextId={object.id}
					dropType={I.DropType.Menu}
					canDropMiddle={true}
				>
					{inner}
				</DropTarget>
			);
		};

		return (
			<div
				ref={node => this.node = node}
				id={treeKey}
				className={cn.join(' ')}
				style={style}
				onContextMenu={e => this.onContext(e, false)}
			>
				{inner}
			</div>
		);
	};

	onContext = (e: React.SyntheticEvent, withElement: boolean): void => {
		e.preventDefault();
		e.stopPropagation();

		const { id, parentId, getSubId, onContext } = this.props;
		const subId = getSubId(parentId);
		const node = $(this.node);
		const element = node.find('.icon.more');

		onContext({ node, element, withElement, subId, objectId: id });
	};

	onToggle (e: React.MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();

		const { id, parentId, onToggle, getSubId } = this.props;
		const object = S.Detail.get(getSubId(parentId), id, J.Relation.sidebar, true);

		onToggle(e, { ...this.props, details: object });
		this.forceUpdate();
	};

});

export default TreeItem;
