import * as React from 'react';
import { IconObject } from 'ts/component';
import { I, DataUtil, Util, translate } from 'ts/lib';
import { observer } from 'mobx-react';
import { detailStore } from 'ts/store';

interface Props extends I.Cell {};
interface State { 
	isEditing: boolean; 
};

const $ = require('jquery');

@observer
class CellFile extends React.Component<Props, State> {

	state = {
		isEditing: false,
	};

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { rootId, block, readonly, relation, index, getRecord, canEdit, iconSize, placeholder } = this.props;
		const record = getRecord(index);
		if (!record) {
			return null;
		};

		let value = this.getValue();
		value = value.map((it: string) => { return detailStore.get(rootId, it, [ 'fileExt' ]); });
		value = value.filter((it: any) => { return !it._empty_; });

		const Item = (item: any) => (
			<div className="element" onClick={(e: any) => { this.onClick(e, item); }}>
				<div className="flex">
					<IconObject object={item} size={iconSize} />
					<div className="name">{item.name + (item.fileExt ? `.${item.fileExt}` : '')}</div>
				</div>
			</div>
		);

		return (
			<div className="wrap">
				{value.length ? (
					<React.Fragment>
						{value.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</React.Fragment>
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

	getValue () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);

		let value = record[relation.relationKey];
		if (!value || ('object' != typeof(value))) {
			value = [];
		};
		return Util.objectCopy(value);
	};

	onClick (e: any, item: any) {
		const { canOpen, canEdit } = this.props;

		if (canOpen && !canEdit) {
			e.stopPropagation();
			DataUtil.objectOpenPopup(item);
		};
	};

};

export default CellFile;