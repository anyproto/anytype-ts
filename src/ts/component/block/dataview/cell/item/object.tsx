import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, Icon } from 'Component';
import { I, S, U } from 'Lib';

interface Props {
	cellId: string;
	size?: number;
	iconSize?: number;
	relation?: any;
	canEdit?: boolean;
	getObject: () => any;
	elementMapper?: (relation: any, item: any) => any;
	onClick?: (e: any, item: any) => void;
	onRemove?: (e: any, id: string) => void;
};

const ItemObject = observer(class ItemObject extends React.Component<Props> {

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onRemove = this.onRemove.bind(this);
	};

	render () {
		const { cellId, size, iconSize, relation, canEdit } = this.props;
		const cn = [ 'element' ];
		const object = this.getObject();
		const { done, isReadonly, isArchived, layout } = object;
		const allowedDetails = S.Block.isAllowed(object.restrictions, [ I.RestrictionObject.Details ]);

		let iconObject = null;
		let iconRemove = null;
		
		if (object.isHidden) {
			cn.push('isHidden');
		};
		if (canEdit) {
			cn.push('canEdit');
			iconRemove = <Icon className="objectRemove" onClick={this.onRemove} />;
		};
		if (relation.relationKey != 'type') {
			iconObject = (
				<IconObject 
					id={`${cellId}-icon`}
					object={object} 
					size={size} 
					iconSize={iconSize}
					canEdit={!isReadonly && !isArchived && allowedDetails && U.Object.isTaskLayout(layout)} 
				/>
			);
		};

		return (
			<div className={cn.join(' ')}>
				<div className="flex">
					{iconObject}
					<ObjectName object={object} onClick={this.onClick} />
					{iconRemove}
				</div>
			</div>
		);
	};

	onClick (e: any) {
		const { onClick } = this.props;
		const object = this.getObject();

		if (onClick) {
			onClick(e, object);
		};
	};

	onRemove (e: any) {
		e.stopPropagation();

		const { canEdit, onRemove } = this.props;
		const object = this.getObject();

		if (canEdit && onRemove) {
			onRemove(e, object.id);
		};
	};

	getObject () {
		const { relation, elementMapper, getObject } = this.props;

		let object = getObject();
		if (elementMapper) {
			object = elementMapper(relation, object);
		};
		return object;
	};

});

export default ItemObject;