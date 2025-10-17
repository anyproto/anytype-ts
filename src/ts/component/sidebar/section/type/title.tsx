import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Editable, Label } from 'Component';
import { J, analytics, I, keyboard, translate } from 'Lib';

const SidebarSectionTypeTitle = observer(class SidebarSectionTypeTitle extends React.Component<I.SidebarSectionComponent> {
	
	refName = null;
	range: I.TextRange = null;
	timeout = 0;
	value = '';

	constructor (props: I.SidebarSectionComponent) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onImageSelect = this.onImageSelect.bind(this);
		this.onIconSelect = this.onIconSelect.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onBlur = this.onBlur.bind(this);
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
						id="sidebar-icon-title" 
						object={object} 
						size={24} 
						canEdit={!readonly}
						onIconSelect={this.onIconSelect}
						onUpload={this.onImageSelect}
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
						onBlur={this.onBlur}
						onKeyDown={this.onKeyDown}
						onKeyUp={this.onKeyUp}
						onSelect={this.onSelect}
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
		const { id, object } = this.props;

		let text = String(object[this.getRelationKey()] || '');
		if (text == translate('defaultNameType')) {
			text = '';
		};

		this.refName?.setValue(text);
		this.refName?.placeholderCheck();
		this.value = text;

		if (!this.range && (id == 'title') && object.id) {
			const l = text.length;

			this.range = { from: l, to: l };
		};

		if (this.range) {
			this.refName?.setRange(this.range);
		};
	};

	onIconSelect (id: string, color: number) {
		this.props.onChange({ iconName: id, iconOption: color, iconImage: '' });

		analytics.stackAdd('SetIcon', { objectType: J.Constant.typeKey.type, color });
	};

	onImageSelect (id: string) {
		this.props.onChange({ iconName: '', iconOption: 0, iconImage: id });
	};

	onChange () {
		const { disableButton, onChange } = this.props;
		const value = this.getValue();

		if (value != this.value) {
			this.value = value;
			disableButton(!value);
			onChange({ [this.getRelationKey()]: value });
		};

		window.clearTimeout(this.timeout);
	};

	onKeyDown (e: any) {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			this.onChange();
		});
	};

	onSelect () {
		this.range = this.refName?.getRange() || null;
	};

	onBlur () {
		this.range = null;
		this.onChange();
	};

	getValue () {
		let t = String(this.refName?.getTextValue() || '');
		if (t === '\n') {
			t = '';
		};
		return t;
	};

	onKeyUp (e: any) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => this.onChange(), J.Constant.delay.keyboard);
	};

});

export default SidebarSectionTypeTitle;
