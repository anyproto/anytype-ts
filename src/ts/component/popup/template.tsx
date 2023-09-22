import * as React from 'react';
import $ from 'jquery';
import { Loader, Title, Label, ListObjectPreview } from 'Component';
import { I, focus, UtilCommon, UtilData, translate, analytics } from 'Lib';
import { dbStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	items: any[];
	loading: boolean;
};

class PopupTemplate extends React.Component<I.Popup, State> {

	_isMounted = false;
	page = 0;
	n = 0;
	ref = null;

	state = {
		items: [],
		loading: false,
	};

	constructor (props: I.Popup) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { items, loading } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { typeId } = data;
		const type = dbStore.getTypeById(typeId);
		const length = items.length;

		if (loading) {
			return <Loader id="loader" />;
		};

		return (
			<div className="wrapper">
				<div className="head">
					<Title text={translate('popupTemplateTitle')} />
					<Label text={UtilCommon.sprintf(translate('popupTemplateText'), UtilCommon.shorten(type.name, 32), length, UtilCommon.plural(length, translate('pluralTemplate')))} />
				</div>

				<ListObjectPreview 
					ref={ref => this.ref = ref}
					getItems={() => items}
					offsetX={-128}
					onClick={this.onClick}
					withBlank={true}
					onBlank={e => this.onClick(e, { id: Constant.templateId.blank })}
					blankId={Constant.templateId.blank}
					defaultId={type.defaultTemplateId || Constant.templateId.blank}
				/>
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.load();

		focus.clear(true);
		window.setTimeout(() => { this.rebind(); }, Constant.delay.popup + 100);
	};

	componentDidUpdate () {
		if (this.ref) {
			this.ref.setActive();
		};
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	unbind () {
		$(window).off('keyup.popupTemplate');
	};

	rebind () {
		this.unbind();
		$(window).on('keyup.popupTemplate', (e: any) => { this.onKeyUp(e); });
	};

	load () {
		const { param } = this.props;
		const { data } = param;
		const { typeId } = data;

		this.setState({ loading: true });

		UtilData.getTemplatesByTypeId(typeId, (message) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			this.setState({ loading: false, items: message.records || [] });
		});
	};

	onKeyUp (e: any) {
		e.preventDefault();
		e.stopPropagation();

		if (this.ref) {
			this.ref.onKeyUp(e);
		};
	};

	onClick (e: any, template: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect, route } = data;

		close();
		window.setTimeout(() => {
			if (onSelect) {
				onSelect(UtilData.checkBlankTemplate(template));
			};
		}, Constant.delay.popup);

		analytics.event('SelectTemplate', { route });
	};

};

export default PopupTemplate;
