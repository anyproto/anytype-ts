import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Title, Label, Button } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.Popup, RouteComponentProps<any> {
	history: any;
};

interface State {
	tab: string;
	subTab: string;
};

const $ = require('jquery');
const raf = require('raf');

class PopupStore extends React.Component<Props, State> {

	state = {
		tab: 'type',
		subTab: '',
	};

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);

		this.resize = this.resize.bind(this);
	};
	
	render () {
		const { tab, subTab } = this.state;
		const tabs = [
			{ id: 'type', 'name': 'Types' },
			{ id: 'template', 'name': 'Templates' },
			{ id: 'relation', 'name': 'Relations' },
		];

		let content = null;
		switch (tab) {

			default:
			case 'type':
				const subTabs = [
					{ id: 'market', 'name': 'Marketplace' },
					{ id: 'library', 'name': 'Library' },
					{ id: 'archive', 'name': 'Archive' },
				];

				content = (
					<React.Fragment>
						<div className="mid">
							<Title text="Type every object" />
							<Label text="Our beautifully-designed templates come with hundreds" />

							<Button text="Create a new type" className="orange" />
						</div>

						<div className="tabs">
							{subTabs.map((item: any, i: number) => (
								<div key={item.id} className={[ 'item', (item.id == subTab ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onSubTab(e, item); }}>
									{item.name}
								</div>
							))}
						</div>
					</React.Fragment>
				);
				break;

			case 'template':
				break;

			case 'relation':
				break;

		};

		return (
			<div className="wrapper">
				<div className="head">
					<div className="tabs">
						{tabs.map((item: any, i: number) => (
							<div key={item.id} className={[ 'item', (item.id == tab ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onTab(e, item); }}>
								{item.name}
							</div>
						))}
					</div>
				</div>
				
				<div className="body">
					{content}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();
	};

	componentDidUpdate () {
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.unbind('resize.store').on('resize.store', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('resize.store');
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		raf(() => {
			const { getId, position } = this.props;
			const win = $(window);
			const obj = $(`#${getId()} #innerWrap`);
			const width = Math.max(960, win.width() - 128);
			const height = Math.max(648, win.height() - 128);

			obj.css({ width: width, height: height });
			position();
		});
	};

	onTab (e: any, item: any) {
		this.setState({ tab: item.id });
	};

	onSubTab (e: any, item: any) {
		this.setState({ subTab: item.id });
	};
	
};

export default PopupStore;