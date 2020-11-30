import * as React from 'react';
import { Label, IconUser } from 'ts/component';
import { I, C, translate } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

interface State {
	items: any[];
};

@observer
class MenuDataviewObjectList extends React.Component<Props, State> {

	state = {
		items: [],
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const relation = data.relation.get();
		const reg = new RegExp(filter, 'i');

		const Item = (item: any) => (
			<div className="item" onClick={(e: any) => { this.onSelect(e, item.id); }}>
				<IconUser className="c18" {...item} />
				{item.name}
			</div>
		);
		
		return (
			<React.Fragment>
				<Label text={translate('menuDataviewObjectListFind')} />
				
				<div className="items">
				</div>
			</React.Fragment>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const relation = data.relation.get();

		const filters = [
			{ relationKey: 'type', operator: I.FilterOperator.And, condition: I.FilterCondition.In, value: relation.objectTypes },
		];

		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		C.ObjectSearch(filters, sorts, (message: any) => {
			console.log(message);
		});
	};
	
	onSelect (e: any, id: number) {
		this.props.close();
	};
	
	onSubmit (e: any) {
		e.preventDefault();
	};
	
};

export default MenuDataviewObjectList;