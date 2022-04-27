import * as React from 'react';
import { IconObject } from 'ts/component';
import { I, DataUtil, translate, Relation } from 'ts/lib';
import { observer } from 'mobx-react';
import { detailStore, dbStore } from 'ts/store';

interface Props extends I.Cell {}
interface State { 
	isEditing: boolean; 
}

const $ = require('jquery');

const CellFile = observer(class CellFile extends React.Component<Props, State> {

	state = {
		isEditing: false,
	};

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { subId, relation, index, getRecord, iconSize, placeholder, elementMapper, arrayLimit } = this.props;
		const record = getRecord(index);
		
		if (!record) {
			return null;
		};

		let value = Relation.getArrayValue(record[relation.relationKey]);
		value = value.map((it: string) => { return detailStore.get(subId, it, []); });
		value = value.filter((it: any) => { return !it._empty_; });
		
		if (elementMapper) {
			value = value.map((it: any) => { return elementMapper(relation, it); });
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
			<div className="element" onClick={(e: any) => { this.onClick(e, item); }}>
				<div className="flex">
					<IconObject object={item} size={iconSize} />
					<div className="name">{DataUtil.fileName(item)}</div>
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
			DataUtil.objectOpenPopup(item);
		};
	};

});

export default CellFile;