import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilObject, translate, Relation } from 'Lib';
import { detailStore } from 'Store';

interface State { 
	isEditing: boolean; 
};

const CellFile = observer(class CellFile extends React.Component<I.Cell, State> {

	state = {
		isEditing: false,
	};

	constructor (props: I.Cell) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { subId, relation, recordId, getRecord, iconSize, placeholder, elementMapper, arrayLimit } = this.props;
		const record = getRecord(recordId);
		
		if (!record) {
			return null;
		};

		let value: any[] = Relation.getArrayValue(record[relation.relationKey]);
		value = value.map(it => detailStore.get(subId, it, []));
		value = value.filter(it => !it._empty_ && !it.isArchived && !it.isDeleted);
		
		if (elementMapper) {
			value = value.map(it => elementMapper(relation, it));
		};

		const cn = [ 'wrap' ];
		const length = value.length;

		if (arrayLimit) {
			value = value.slice(0, arrayLimit);
			if (length > arrayLimit) {
				cn.push('overLimit');
			};
		};

		const Item = (item: any) => (
			<div className="element" onClick={e => this.onClick(e, item)}>
				<div className="flex">
					<IconObject object={item} size={iconSize} />
					<ObjectName object={item} />
				</div>
			</div>
		);

		return (
			<div className={cn.join(' ')}>
				{value.length ? (
					<span className="over">
						{value.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
						{arrayLimit && (length > arrayLimit) ? <div className="more">+{length - arrayLimit}</div> : ''}
					</span>
				) : (
					<div className="empty">{placeholder || translate(`placeholderCell${relation.format}`)}</div>
				)}
			</div>
		);
	};

	componentDidUpdate () {
		const { isEditing } = this.state;
		const { id } = this.props;
		const cell = $('#' + id);

		if (isEditing) {
			cell.addClass('isEditing');
		} else {
			cell.removeClass('isEditing');
		};
	};

	setEditing (v: boolean) {
		const { canEdit } = this.props;
		const { isEditing } = this.state;

		if (canEdit && (v != isEditing)) {
			this.setState({ isEditing: v });
		};
	};

	onClick (e: any, item: any) {
		const { canOpen, canEdit } = this.props;

		if (canOpen && !canEdit) {
			e.stopPropagation();
			UtilObject.openPopup(item);
		};
	};

});

export default CellFile;
