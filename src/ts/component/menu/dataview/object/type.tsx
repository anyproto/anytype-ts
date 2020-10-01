import * as React from 'react';
import { I, C } from 'ts/lib';
import { Icon, Input, Button } from 'ts/component';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

interface State {
	layout: I.ObjectLayout;
};

@observer
class MenuObjectType extends React.Component<Props, State> {

	ref: any = null;
	state = {
		layout: null,
	};
	
	constructor(props: any) {
		super(props);
		
		this.onType = this.onType.bind(this);
		this.onCreate = this.onCreate.bind(this);
	};

	render () {
		const options = this.getItems();
		const { layout } = this.state;

		let item = null;
		if (layout !== null) {
			item = options.find((it: any) => { return it.id == layout; });
		};

		let current = null;
		if (item) {
			current = (
				<div id="object-layout" className={'item ' + (commonStore.menuIsOpen('select') ? 'active' : '')} onClick={this.onType}>
					<Icon className={item.icon} />
					<div className="name">{item.name}</div>
					<Icon className="arrow" />
				</div>
			);
		} else {
			current = (
				<div id="object-layout" className={'item ' + (commonStore.menuIsOpen('select') ? 'active' : '')} onClick={this.onType}>
					<div className="name">Select type</div>
					<Icon className="arrow" />
				</div>
			);
		};

		return (
			<div>
				<div className="sectionName">Object type name</div>
				<div className="wrap">
					<Input ref={(ref: any) => { this.ref = ref; }} />
				</div>
				<div className="sectionName">object type name</div>
				{current}
				<div className="buttons">
					<Button text="Create" className="orange" onClick={this.onCreate} />
				</div>
			</div>
		);
	};

	getItems () {
		return [
			{ id: I.ObjectLayout.Page, icon: 'page', emoji: '', name: 'Page' },
			{ id: I.ObjectLayout.Contact, icon: 'contact', emoji: '', name: 'Contact' },
			{ id: I.ObjectLayout.Task, icon: 'task', emoji: '', name: 'Task' },
		];
	};
	
	onType (e: any) {
		const { layout } = this.state;

		commonStore.menuOpen('select', { 
			element: '#object-layout',
			offsetX: 224,
			offsetY: 4,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Center,
			horizontal: I.MenuDirection.Left,
			data: {
				options: this.getItems(),
				value: layout,
				onSelect: (e: any, item: any) => {
					this.setState({ layout: item.id });
				}
			}
		});
	};

	onCreate () {
		const { param, close } = this.props;
		const { data } = param;
		const { onCreate } = data;
		const name = this.ref.getValue();
		const { layout } = this.state;

		C.ObjectTypeCreate({ name: name, layout: layout }, (message: any) => {
			if (message.error.code) {
				return;
			};

			onCreate(message.objectType);
		});

		close();
	};
	
};

export default MenuObjectType;