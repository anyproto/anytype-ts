import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Editable, Label } from 'Component';
import { J, analytics, I, keyboard, translate } from 'Lib';

const SidebarSectionTypeTitle = observer(class SidebarSectionTypeTitle extends React.Component<I.SidebarSectionComponent> {
	
	refName = null;
	timeout = 0;

	constructor (props: I.SidebarSectionComponent) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
	};

    render () {
		const { id, object, readonly } = this.props;

		let icon = null;
		let label = '';
		let placeholder = '';

		switch (id) {
			case 'title': {
				label = translate('sidebarTypeTitleLabelName');
				placeholder = translate('sidebarTypeTitlePlaceholder');
				icon = (
					<IconObject 
						id={`sidebar-icon-title-${object.id}`} 
						object={object} 
						size={24} 
						canEdit={!readonly}
						onIconSelect={this.onSelect}
						menuParam={{
							horizontal: I.MenuDirection.Center,
							className: 'fixed',
							classNameWrap: 'fromSidebar',
						}}
					/>
				);
				break;
			};

			case 'plural': {
				label = translate('sidebarTypeTitleLabelPlural');
				placeholder = translate('sidebarTypeTitlePlaceholderPlural');
				break;
			};

		};

        return (
			<div className="wrap">
				<Label text={label} />

				<div className="flex">
					{icon}
					<Editable
						ref={ref => this.refName = ref}
						readonly={readonly}
						onBlur={this.onChange}
						onKeyDown={this.onKeyDown}
						onKeyUp={this.onKeyUp}
						placeholder={placeholder}
					/>
				</div>
			</div>
		);
    };

	componentDidMount(): void {
		this.setValue();
	};

	componentDidUpdate () {
		this.setValue();
	};

	componentWillUnmount(): void {
		window.clearTimeout(this.timeout);	
	};

	getRelationKey (): string {
		switch (this.props.id) {
			case 'title': return 'name';
			case 'plural': return 'pluralName';
		};
		return '';
	};

	setValue () {
		const { object } = this.props;

		let text = String(object[this.getRelationKey()] || '');
		if (text == translate('defaultNameType')) {
			text = '';
		};

		this.refName.setValue(text);
		this.refName.placeholderCheck();
	};

	onSelect (id: string, color: number) {
		this.props.onChange({ iconName: id, iconOption: color });

		analytics.stackAdd('SetIcon', { objectType: J.Constant.typeKey.type, color });
	};

	onChange () {
		const value = this.refName?.getTextValue().trim();

		this.props.onChange({ [this.getRelationKey()]: value });
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			this.onChange();
		});
	};

	onKeyUp (e: any) {
		const value = this.refName?.getTextValue().trim();

		this.props.disableButton(!value);
	};

});

export default SidebarSectionTypeTitle;
