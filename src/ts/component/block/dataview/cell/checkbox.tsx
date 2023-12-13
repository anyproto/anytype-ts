import * as React from 'react';
import { Icon } from 'Component';
import { I, UtilCommon, translate } from 'Lib';
import { observer } from 'mobx-react';

const CellCheckbox = observer(class CellCheckbox extends React.Component<I.Cell> {

	constructor (props: I.Cell) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { recordId, getRecord, withLabel, withName, relation } = this.props;
		const record = getRecord(recordId);
		
		if (!record) {
			return null;
		};

		const value = this.getValue();
		const cn = [];

		if (value) {
			cn.push('active');
		};

		let label = UtilCommon.sprintf(translate(`relationCheckboxLabel${Number(value)}`), relation.name);

		if (withName) {
			label = relation.name;
		};

		return (
			<React.Fragment>
				<Icon className={cn.join(' ')} />
				{withLabel ? <span className="label">{label}</span> : ''}
			</React.Fragment>
		);
	};

	getValue () {
		const { relation, getRecord, recordId } = this.props;
		const record = getRecord(recordId);

		return Boolean(record[relation.relationKey]);
	};

	onClick () {
		const { onChange } = this.props;
		const value = this.getValue();

		onChange(!value);
	};
	
});

export default CellCheckbox;
