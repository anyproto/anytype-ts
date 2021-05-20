import * as React from 'react';
import { Icon } from 'ts/component';
import { I, DataUtil, translate } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

const Constant = require('json/constant.json');

@observer
class MenuRelationType extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onSelect = this.onSelect.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { value } = data;
		const relations: any[] = [
			{ format: I.RelationType.LongText },
			//{ format: I.RelationType.ShortText },
			{ format: I.RelationType.Number },
			{ format: I.RelationType.Status },
			{ format: I.RelationType.Tag },
			{ format: I.RelationType.Date },
			{ format: I.RelationType.File },
			{ format: I.RelationType.Checkbox },
			{ format: I.RelationType.Url },
			{ format: I.RelationType.Email },
			{ format: I.RelationType.Phone },
			{ format: I.RelationType.Object },
		];

		const Item = (item: any) => {
			return (
				<div className={[ 'item', (item.format == value ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onSelect(e, item); }}>
					<Icon className={'relation ' + DataUtil.relationClass(item.format)} />
					<div className="name">{translate('relationName' + item.format)}</div>
				</div>
			);
		};

		return (
			<div className="section">
				<div className="name">Type of relation</div>
				<div className="items">
					{relations.map((item: any, i: number) => (
						<Item key={i} {...item} />
					))}
				</div>
			</div>
		);
	};
	
	onSelect (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onSelect } = data;
		
		this.props.close();
		onSelect(item);
	};
	
};

export default MenuRelationType;