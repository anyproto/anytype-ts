import * as React from 'react';
import { I, C, SmileUtil, translate } from 'ts/lib';
import { MenuItemVertical, Input, Button } from 'ts/component';
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

		return (
			<div>
				<div className="sectionName">{translate('menuDataviewObjectTypeEditName')}</div>
				<div className="wrap">
					<Input ref={(ref: any) => { this.ref = ref; }} />
				</div>

				<div className="sectionName">{translate('menuDataviewObjectTypeEditLayout')}</div>
				<MenuItemVertical 
					id="object-layout" 
					icon={item ? item.icon : ''} 
					name={item ? item.name : 'Select type'}
					menuId="select"
					onClick={this.onType} 
					arrow={true}
				/>

				<div className="buttons">
					<Button text={translate('commonCreate')} className="orange" onClick={this.onCreate} />
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
			element: '#item-object-layout',
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

		C.ObjectTypeCreate({ name: name, layout: layout, iconEmoji: SmileUtil.random() }, (message: any) => {
			if (message.error.code) {
				return;
			};

			onCreate(message.objectType);
		});

		close();
	};
	
};

export default MenuObjectType;