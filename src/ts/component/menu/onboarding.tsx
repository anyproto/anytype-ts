import * as React from 'react';
import { Icon } from 'ts/component';
import { I, Docs } from 'ts/lib';
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
		const { key, item, current } = data;
		const { name, description } = item;
		const items = Docs.Help.Onboarding[key];
		const l = items.length;
		const cnl = [ 'arrow', 'left', (current == 0 ? 'disabled' : '') ];
		const cnr = [ 'arrow', 'right', (current == l - 1 ? 'disabled' : '') ];

		return (
			<div className="wrap">
				<div className="name">{name}</div>
				<div className="descr">{description}</div>
				<Icon className="close" onClick={this.onClose} />

				<div className="bottom">
					<Icon className={cnl.join(' ')} onClick={(e: any) => { this.onArrow(e, -1); }} />
					<div className="number">{current + 1} of {l}</div>
					<Icon className={cnr.join(' ')} onClick={(e: any) => { this.onArrow(e, 1); }} />
				</div>
			</div>
		);
	};

	onClose () {
		const { close } = this.props;

		close();
	};

	onArrow (e: any, dir: number) {
		const { param } = this.props;
		const { data } = param;
		const { key, current, total } = data;
		const items = Docs.Help.Onboarding[key];

		if (((dir < 0) && (current == 0)) || ((dir > 0) && (current == items.length - 1))) {
			return;
		};

		const next = current + dir;
		const item = items[next];

		if (!item) {
			return;
		};

		menuStore.open('onboarding', {
			...item,
			withArrow: true,
			noAnimation: true,
			noFlipY: true,
			noFlipX: true,
			data: {
				key,
				item,
				current: next,
			},
		});
	};

};

export default MenuOnboarding;
