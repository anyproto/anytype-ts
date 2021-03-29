import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, Title, Label, IconObject, HeaderMainSet as Header } from 'ts/component';
import { I, C, Util, DataUtil, translate } from 'ts/lib';
import { commonStore, blockStore, dbStore, menuStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {};

@observer
class PageMainSet extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onAdd = this.onAdd.bind(this);
	};

	render () {
		const { config } = commonStore;

		let objectTypes = Util.objectCopy(dbStore.objectTypes);
		if (!config.debug.ho) {
			objectTypes = objectTypes.filter((it: I.ObjectType) => { return !it.isHidden; });
		};

		const Item = (item: any) => {
			return (
				<div className={[ 'item', (item.isHidden ? 'isHidden' : '') ].join(' ')} onClick={(e: any) => { this.setCreate(item); }}>
					<IconObject object={{ ...item, layout: I.ObjectLayout.ObjectType }} />
					<div className="name">{item.name}</div>
				</div>
			);
		};

		return (
			<div>
				<Header {...this.props} rootId="" />
				<div className="wrapper">
					<IconObject size={96} object={{ iconClass: 'newSet' }} />
					<Title text={translate('setTitle')} />
					<Label text={translate('setText')} />
					<div className="items">
						<div id="button-add" className="item add" onClick={this.onAdd}>
							<Icon className="add" />
							<div className="name">Create new object type</div>
						</div>
						{objectTypes.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};

	onAdd (e: any) {
		const { objectTypes } = dbStore;

		menuStore.open('objectTypeEdit', { 
			element: '#button-add',
			offsetX: 28,
			offsetY: 4,
			data: {
				onCreate: (type: I.ObjectType) => {
					objectTypes.push(type);
					dbStore.objectTypesSet(objectTypes);
				}
			}
		});
	};

	setCreate (item: any) {
		const { root } = blockStore;

		C.BlockCreateSet(root, '', item.id, { name: item.name + ' set', iconEmoji: item.iconEmoji }, I.BlockPosition.Bottom, (message: any) => {
			if (message.error.code) {
				return;
			};

			DataUtil.objectOpen({ id: message.targetId });
		});
	};
	
};

export default PageMainSet;