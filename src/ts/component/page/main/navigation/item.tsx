import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, ObjectDescription, ObjectType } from 'Component';
import { I, U, S } from 'Lib';

interface Props {
	item: any;
	style?: any;
	compact?: boolean;
	isLocked?: boolean;
	onClick?: (item: any) => void;
	onContext?: (item: any) => void;
	onMouseEnter?: (item: any) => void;
	onMouseLeave?: (item: any) => void;
};

const ObjectItem = observer(class ObjectItem extends React.Component<Props> {
	
	node = null;

	render() {
		const { item, style, compact, onClick, onContext, onMouseEnter, onMouseLeave } = this.props;
		const cn = [ 'item', U.Data.layoutClass(item.id, item.layout) ];
		const type = S.Record.getTypeById(item.type);
		const isFile = U.Object.isInFileLayouts(item.layout);
		const canEdit = U.Object.isTaskLayout(item.layout) && S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]);

		if (compact) {
			cn.push('isCompact');
		};

		let iconSmall = null;
		let iconLarge = null;
		let description = null;
		let content = null;

		if (compact) {
			iconSmall = <IconObject object={item} size={18} iconSize={18} canEdit={canEdit} />;
		} else {
			const iconSize = isFile ? 48 : null;

			iconLarge = <IconObject object={item} size={48} iconSize={iconSize} canEdit={canEdit} />;
			description = <ObjectDescription object={item} />;
		};

		if (isFile) {
			cn.push('isFile');
			description = <div className="descr">{U.File.size(item.sizeInBytes)}</div>;
		};

		if (!compact) {
			content = (
				<>
					{iconLarge}
					<div className="info">
						<div className="nameWrap">
							<ObjectName object={item} withPlural={true} />
						</div>
						<div className="bottomWrap">
							<div className="type">
								<ObjectType object={type} />
							</div>
							<div className="bullet" />
							{description}
						</div>
					</div>
				</>
			);
		} else {
			content = (
				<div className="nameWrap">
					{iconSmall}
					<ObjectName object={item} withPlural={true} />
				</div>
			);
		};

		return (
			<div 
				ref={ref => this.node = ref}
				id={`item-${item.id}`}
				className={cn.join(' ')} 
				style={style}
				onClick={onClick}
				onContextMenu={onContext}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				{content}
			</div>
		);
	};

	componentDidMount () {
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
	};

	resize () {
		const node = $(this.node);

		node.toggleClass('withIcon', !!node.find('.iconObject').length);
		node.toggleClass('withDescr', !!node.find('.descr').length);
	};

});

export default ObjectItem;
