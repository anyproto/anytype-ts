import * as React from 'react';
import { I, C, SmileUtil, translate, DataUtil } from 'ts/lib';
import { MenuItemVertical, Input, Button } from 'ts/component';
import { menuStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

interface State {
	layout: I.ObjectLayout;
};

@observer
class MenuObjectTypeEdit extends React.Component<Props, State> {

	ref: any = null;
	state = {
		layout: I.ObjectLayout.Page,
	};
	
	constructor(props: any) {
		super(props);
		
		this.onLayout = this.onLayout.bind(this);
		this.onCreate = this.onCreate.bind(this);
	};

	render () {
		const options = DataUtil.menuGetLayouts();
		const { layout } = this.state;
		const item = options.find((it: any) => { return it.id == layout; });

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
					name={item ? item.name : 'Select layout'}
					onClick={this.onLayout} 
					arrow={true}
				/>

				<div className="buttons">
					<Button text={translate('commonCreate')} onClick={this.onCreate} />
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.focus();
	};

	focus () {
		window.setTimeout(() => {
			if (this.ref) {
				this.ref.focus();
			};
		}, 15);
	};

	onLayout (e: any) {
		const { getId, getSize } = this.props;
		const { layout } = this.state;

		menuStore.open('select', { 
			element: `#${getId()} #item-object-layout`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			data: {
				options: DataUtil.menuTurnLayouts(),
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

export default MenuObjectTypeEdit;