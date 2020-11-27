import * as React from 'react';
import { Label, IconUser } from 'ts/component';
import { I, translate } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

@observer
class MenuDataviewObjectList extends React.Component<Props, {}> {
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
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
	
	onSelect (e: any, id: number) {
		this.props.close();
	};
	
	onSubmit (e: any) {
		e.preventDefault();
	};
	
};

export default MenuDataviewObjectList;