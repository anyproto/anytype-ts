import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Smile, HeaderMainSet as Header } from 'ts/component';

interface Props extends RouteComponentProps<any> {};

@observer
class PageMainSet extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
	};

	render () {
		const items = [
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
				<div className="item">
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
						<div className="item add">
							<Icon className="add" />
							<div className="name">Create new object type</div>
						</div>
						{items.map((item: any, i: number) => (
							<Item key={i} {...item} />
						))}
					</div>
				</div>
			</div>
		);
	};
	
};

export default PageMainSet;