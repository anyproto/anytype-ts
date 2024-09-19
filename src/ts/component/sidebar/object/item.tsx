import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, ObjectDescription, ObjectType } from 'Component';
import { U, S } from 'Lib';

interface Props {
	item: any;
	style?: any;
	allowSystemLayout?: boolean;
	onClick?: (item: any) => void;
	onContext?: (item: any) => void;
	onMouseEnter?: (item: any) => void;
	onMouseLeave?: (item: any) => void;
};

const ObjectItem = observer(class ObjectItem extends React.Component<Props> {
	
	node = null;

    render() {
		const { item, style, allowSystemLayout, onClick, onContext, onMouseEnter, onMouseLeave } = this.props;
		const cn = [ 'item', U.Data.layoutClass(item.id, item.layout) ];
		const type = S.Record.getTypeById(item.type);
		const isFile = U.Object.isInFileLayouts(item.layout);

		let iconSmall = null;
		let iconLarge = null;
		let description = null;

		if (allowSystemLayout && U.Object.isTypeOrRelationLayout(item.layout)) {
			const size = U.Object.isTypeLayout(item.layout) ? 18 : 20;

			iconSmall = <IconObject object={item} size={size} iconSize={18} />;
		} else {
			const iconSize = isFile ? 48 : null;
			iconLarge = <IconObject object={item} size={48} iconSize={iconSize} />;
		};

		if (isFile) {
			cn.push('isFile');
			description = <div className="descr">{U.File.size(item.sizeInBytes)}</div>;
		} else {
			description = <ObjectDescription object={item} />;
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
				{iconLarge}
				<div className="info">
					<div className="nameWrap">
						{iconSmall}
						<ObjectName object={item} />
					</div>
					<div className="bottomWrap">
						<div className="type">
							<ObjectType object={type} />
						</div>
						<div className="bullet" />
						{description}
					</div>
				</div>
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

		node.find('.iconObject').length ? node.addClass('withIcon') : node.removeClass('withIcon');
		node.find('.descr').length ? node.addClass('withDescr') : node.removeClass('withDescr');
	};

});

export default ObjectItem;