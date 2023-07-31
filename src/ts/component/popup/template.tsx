import * as React from 'react';
import $ from 'jquery';
import { Loader, Title, Label, ListObjectPreview } from 'Component';
import { I, focus, UtilCommon, UtilData, translate } from 'Lib';
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
		const type = dbStore.getType(typeId);
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
		const filters: I.Filter[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.template },
			{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.Equal, value: typeId },
		];
		const sorts = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc, includeTime: true },
		];

		this.setState({ loading: true });
		UtilData.search({
			filters,
			sorts,
		}, (message: any) => {
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

	onClick (e: any, item: any) {
		const { param, close } = this.props;
		const { data } = param;
		const { onSelect } = data;

		close();
		window.setTimeout(() => {
			if (onSelect) {
				onSelect(UtilData.checkBlankTemplate(item));
			};
		}, Constant.delay.popup);
	};

};

export default PopupTemplate;
