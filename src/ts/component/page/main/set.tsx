import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Smile, HeaderMainSet as Header } from 'ts/component';
import { I, C, DataUtil } from 'ts/lib';
import { commonStore, dbStore, blockStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {};

interface State {
	objectTypes: I.ObjectType[];
};

@observer
class PageMainSet extends React.Component<Props, State> {

	constructor (props: any) {
		super(props);

		this.onAdd = this.onAdd.bind(this);
	};

	render () {
		let { objectTypes } = this.state;

		objectTypes.sort((c1: I.ObjectType, c2: I.ObjectType) => {
			if (c1.name > c2.name) return 1;
			if (c1.name < c2.name) return -1;
			return 0;
		});

		const Item = (item: any) => {
			let icon = null;
			let id = DataUtil.schemaField(item.url);
			
			if (item.iconEmoji) {
				icon = <Smile icon={item.iconEmoji} />;
			} else {
				icon = <Icon className={id} />;
			};
			return (
				<div className="item" onClick={(e: any) => { this.setCreate(item); }}>
					{icon}
					<div className="name">{item.name}</div>
				</div>
			);
		};

		return (
			<div>
				<Header {...this.props} rootId="" />
				<div className="wrapper">
					<Icon className="new" />
					<Title text="New set" />
					<Label text="Choose a object type for this set" />
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

	componentDidMount () {
		C.ObjectTypeList((message: any) => {
			this.setState({ objectTypes: message.objectTypes });
		});
	};

	onAdd (e: any) {
		const { objectTypes } = this.state;

		commonStore.menuOpen('dataviewObjectType', { 
			element: '#button-add',
			offsetX: 28,
			offsetY: 4,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				onCreate: (type: I.ObjectType) => {
					objectTypes.push(type);
					this.setState({ objectTypes: objectTypes });
				}
			}
		});
	};

	setCreate (item: any) {
		const { root } = blockStore;

		if (!item.url) {
			return;
		};

		C.BlockCreateSet(root, '', item.url, { name: item.name + ' set', iconEmoji: item.iconEmoji }, I.BlockPosition.Bottom, (message: any) => {
			if (message.error.code) {
				return;
			};

			DataUtil.pageOpen(message.targetId);
		});
	};
	
};

export default PageMainSet;