import * as React from 'react';
import { Tag, Icon } from 'ts/component';
import { I, Relation, DataUtil, translate } from 'ts/lib';
import { observer } from 'mobx-react';
import { menuStore } from 'ts/store';
import { getRange, setRange } from 'selection-ranges';

interface Props extends I.Cell {};
interface State { 
	isEditing: boolean; 
};

const $ = require('jquery');

const CellSelect = observer(class CellSelect extends React.Component<Props, State> {

	_isMounted: boolean = false;
	state = {
		isEditing: false,
	};

	constructor (props: any) {
		super(props);

		this.onClear = this.onClear.bind(this);
	};

	render () {
		const { rootId, block, relation, getRecord, index, placeholder, elementMapper, arrayLimit } = this.props;
		const { isEditing } = this.state;
		const record = getRecord(index);
		const canClear = relation.format == I.RelationType.Status;
		const cn = [ 'wrap' ];

		if (!relation || !record) {
			return null;
		};

		let value = Relation.getArrayValue(record[relation.relationKey]);
		value = value.map((id: string) => { 
			return (relation.selectDict || []).find((it: any) => { return it.id == id; });
		});
		value = value.filter((it: any) => { return it && it.id; });
		let length = value.length;

		if (elementMapper) {
			value = value.map((it: any) => { return elementMapper(relation, it); });
		};

		if (arrayLimit) {
			value = value.slice(0, arrayLimit);
		};

		let content = null;
		if (isEditing) {
			content = (
				<div
					id="value"
					contentEditable={true}
					suppressContentEditableWarning={true}
					onDragStart={(e: any) => { e.preventDefault(); }}
				>
					{value.map((item: any, i: number) => (
						<Tag {...item} key={item.id} className={DataUtil.tagClass(relation.format)} />
					))}
					<span id="entry"></span>
				</div>
			);
		} else {
			if (!value.length) {
				content = <div className="empty">{placeholder || translate(`placeholderCell${relation.format}`)}</div>;
			} else {
				content = (
					<React.Fragment>
						<span className="over">
							{value.map((item: any, i: number) => (
								<Tag {...item} key={item.id} className={DataUtil.tagClass(relation.format)} />
							))}
						</span>
						{arrayLimit && (length > arrayLimit) ? <div className="more">+{length - arrayLimit}</div> : ''}
						{canClear ? <Icon className="clear" onMouseDown={this.onClear} /> : ''}
					</React.Fragment>
				);
			};
		};

		return (
			<div className={cn.join(' ')}>
				{content}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	componentDidUpdate () {
		const { isEditing } = this.state;
		const { id } = this.props;
		const cell = $(`#${id}`);

		if (isEditing) {
			cell.addClass('isEditing');

			const value = cell.find('#value');
			const entry = value.find('#entry');

			value.focus();
			setRange(entry.get(0), { start: 0, end: 0 });
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

	onClear (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { onChange } = this.props;
		
		if (onChange) {
			onChange([], () => {
				menuStore.updateData('dataviewOptionValues', { value: [] });
				menuStore.updateData('dataviewOptionList', { value: [] });
			});
		};
	};

	getValue () {
		const { id } = this.props;
		const cell = $(`#${id}`);
		const value = cell.find('#value');
		return value.get(0).innerText;
	};

});

export default CellSelect;