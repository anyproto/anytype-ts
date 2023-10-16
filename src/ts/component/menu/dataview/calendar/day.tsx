import * as React from 'react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilObject, keyboard } from 'Lib';
import { observer } from 'mobx-react';

const MenuCalendarDay = observer(class MenuCalendarDay extends React.Component<I.Menu> {
	
	n = 0;

	render () {
		const { param } = this.props;
		const { data } = param;
		const { d, getView, className } = data;
		const items = this.getItems();
		const view = getView();
		const { hideIcon } = view;
		const cn = [ 'day' ];

		if (className) {
			cn.push(className);
		};

		const Item = (item) => (
			<div 
				id={`item-${item.id}`}
				className="item" 
				onClick={e => this.onClick(e, item)}
				onMouseEnter={e => this.onMouseEnter(e, item)}
			>
				{!hideIcon ? <IconObject object={item} size={16} /> : ''}
				<ObjectName object={item} />
			</div>
		);

		return (
			<div className={cn.join(' ')}>
				<div className="number">{d}</div>
				<div className="items">
					{items.map((item, i) => (
						<Item key={i} {...item} />
					))}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	componentDidUpdate () {
		this.props.position();
	};

	componentWillUnmount() {
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { items } = data;

		return items || [];
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
		UtilObject.openAuto(item);
	};

});

export default MenuCalendarDay;