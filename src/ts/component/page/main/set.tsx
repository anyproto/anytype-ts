import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Smile, HeaderMainSet as Header } from 'ts/component';
import { I, C, DataUtil } from 'ts/lib';
import { commonStore } from 'ts/store';

interface Props extends RouteComponentProps<any> {};

interface State {
	types: any[];
};

@observer
class PageMainSet extends React.Component<Props, State> {

	state = {
		types: [] as any[],
	};

	constructor (props: any) {
		super(props);

		this.onAdd = this.onAdd.bind(this);
	};

	render () {
		let { types } = this.state;
		let items = [
			{ id: '', icon: 'page', emoji: '', name: 'Page' },
			{ id: '', icon: 'contact', emoji: '', name: 'Contact' },
			{ id: '', icon: 'task', emoji: '', name: 'Task' },
			{ id: '', icon: '', emoji: '💾', name: 'Doc' },
			{ id: '', icon: '', emoji: '🎓', name: 'Univercity' },
			{ id: '', icon: '', emoji: '📅', name: 'Meeting' },
			{ id: '', icon: '', emoji: '📚', name: 'Book review' },
		];

		const Item = (item: any) => {
			let icon = null;
			if (item.emoji) {
				icon = <Smile icon={item.emoji} />;
			} else 
			if (item.icon) {
				icon = <Icon className={item.icon} />;
			};
			return (
				<div className="item" onClick={(e: any) => { this.setCreate(item); }}>
					{icon}
					<div className="name">{item.name}</div>
				</div>
			);
		};

		types = types.concat(items);

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
						{types.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};

	componentDidMount () {
		C.ObjectTypeList((message: any) => {
			this.setState({ types: message.objectTypes });
		});
	};

	onAdd (e: any) {
		const { types } = this.state;

		commonStore.menuOpen('dataviewObjectType', { 
			element: '#button-add',
			offsetX: 28,
			offsetY: 4,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				onCreate: (item: I.ObjectType) => {
					types.push(item);
					this.setState({ types: types });
				}
			}
		});
	};

	setCreate (item: any) {
		if (!item.url) {
			return;
		};

		C.SetCreate(item.url, (message: any) => {
			if (message.error.code) {
				return;
			};
			
			DataUtil.pageOpen(null, message.pageId);
		});
	};
	
};

export default PageMainSet;