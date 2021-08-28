import * as React from 'react';
import { Tag, Icon } from 'ts/component';
import { I, Util, DataUtil, translate } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Cell {}
interface State { 
	isEditing: boolean; 
}

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
		const { rootId, block, relation, getRecord, index, placeholder, elementMapper } = this.props;
		const record = getRecord(index);
		const canClear = relation.format == I.RelationType.Status;
		const cn = [ 'wrap' ];

		if (!relation || !record) {
			return null;
		};

		let value = DataUtil.getRelationArrayValue(record[relation.relationKey]);
		value = value.map((id: string) => { 
			return (relation.selectDict || []).find((it: any) => { return it.id == id; });
		});
		value = value.filter((it: any) => { return it && it.id; });

		if (elementMapper) {
			value = value.map((it: any) => { return elementMapper(relation, it); });
		};
		if (!value.length) {
			cn.push('isEmpty');
		};

		return (
			<div className={cn.join(' ')}>
				{value.length ? (
					<React.Fragment>
						<span className="over">
							{value.map((item: any, i: number) => {
								return <Tag {...item} key={item.id} className={DataUtil.tagClass(relation.format)} />;
							})}
						</span>
						{canClear ? <Icon className="clear" onMouseDown={this.onClear} /> : ''}
					</React.Fragment>
				) : (
					<div className="empty">{placeholder || translate(`placeholderCell${relation.format}`)}</div>
				)}
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

	onClear (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { onChange } = this.props;
		
		if (onChange) {
			onChange([], () => {
				this.setEditing(false);
			});
		};
	};

});

export default CellSelect;