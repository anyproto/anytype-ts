import * as React from 'react';
import { Icon, Label } from 'Component';
import { I, UtilCommon, translate } from 'Lib';
import { observer } from 'mobx-react';

const CellCheckbox = observer(class CellCheckbox extends React.Component<I.Cell> {

	constructor (props: I.Cell) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { withLabel, withName, relation, record } = this.props;
		
		if (!record) {
			return null;
		};

		const value = this.getValue();
		const cn = [];

		if (value) {
			cn.push('active');
		};

		let label = '';
		if (withLabel) {
			label = UtilCommon.sprintf(translate(`relationCheckboxLabel${Number(value)}`), relation.name);
		} else
		if (withName) {
			label = relation.name;
		};

		return (
			<React.Fragment>
				<Icon className={cn.join(' ')} />
				{label ? <Label text={label} /> : ''}
			</React.Fragment>
		);
	};

	getValue () {
		const { relation, record } = this.props;

		return Boolean(record[relation.relationKey]);
	};

	onClick () {
		const { onChange } = this.props;
		const value = this.getValue();

		onChange(!value);
	};
	
});

export default CellCheckbox;
