import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon } from 'ts/component';
import { I, Docs, Onboarding, Util } from 'ts/lib';
import { menuStore } from 'ts/store';

interface Props extends I.Menu {};

class MenuOnboarding extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onClose = this.onClose.bind(this)
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { key, current } = data;
		const items = Docs.Help.Onboarding[key];
		const item = items[current];
		const l = items.length;
		const cnl = [ 'arrow', 'left', (current == 0 ? 'disabled' : '') ];
		const cnr = [ 'arrow', 'right', (current == l - 1 ? 'disabled' : '') ];

		return (
			<div className="wrap">
				<div className="name"  dangerouslySetInnerHTML={{ __html: item.name }} />
				<div className="descr" dangerouslySetInnerHTML={{ __html: item.description }} />

				<Icon className="close" onClick={this.onClose} />

				{l > 1 ? (
					<div className="bottom">
						<Icon className={cnl.join(' ')} onClick={(e: any) => { this.onArrow(e, -1); }} />
						<div className="number">{current + 1} of {l}</div>
						<Icon className={cnr.join(' ')} onClick={(e: any) => { this.onArrow(e, 1); }} />
					</div>
				) : ''}
			</div>
		);
	};

	componentDidMount () {
		Util.renderLink($(ReactDOM.findDOMNode(this)));
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;

		if (data.onShow) {
			data.onShow();
		};

		Util.renderLink($(ReactDOM.findDOMNode(this)));
	};

	onClose () {
		this.props.close();
	};

	onArrow (e: any, dir: number) {
		const { data } = this.props.param;
		const { key, current, isPopup } = data;
		const items = Docs.Help.Onboarding[key];

		if (((dir < 0) && (current == 0)) || ((dir > 0) && (current == items.length - 1))) {
			return;
		};

		const next = current + dir;
		const item = items[next];

		if (!item) {
			return;
		};

		const param = Onboarding.getParam(item, isPopup);

		menuStore.open('onboarding', {
			...param,
			data: {
				...data,
				...param.data,
				current: next,
			},
		});
	};

};

export default MenuOnboarding;
