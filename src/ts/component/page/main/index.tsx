import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconUser } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { dispatcher, I } from 'ts/lib';

const $ = require('jquery');

interface Props extends RouteComponentProps<any> {
	authStore?: any;
};

interface State {
	coverSelector: boolean;
	cover: number;
};

@inject('authStore')
@observer
class PageMainIndex extends React.Component<Props, State> {
	
	state = {
		coverSelector: false,
		cover: 1,
	};

	constructor (props: any) {
		super(props);

		this.onCover = this.onCover.bind(this);
		this.onProfile = this.onProfile.bind(this);
	};
	
	render () {
		const { authStore } = this.props;
		const { coverSelector, cover } = this.state;
		
		let covers = [ {}, {}, {} ];
		let Cover = () => (<div/>);
		
        return (
			<div>
				{coverSelector ? <div className="selectorDimmer" onMouseDown={this.onCover} /> : ''}
				
				<div id="cover" className={'cover c' + cover} />
				<div className="logo" />
				<div className="topMenu">
					<div className="item" onMouseDown={this.onCover}>Change cover</div>
					<div className="item" onMouseDown={this.onProfile}>Settings</div>
				</div>
				
				{coverSelector ? (
					<div className="coverSelector">
						{covers.map((item, i) => {
							return <Cover key={i} {...item} />;
						})}
						
						<div className="item add dn">
							<Icon />
						</div>
					</div>
				) : ''}
				
				<div id="body" className="wrapper">
					<div className="title">
						{authStore.account ? 'Hi, ' + authStore.account.name : ''}
						{authStore.account ? <IconUser name={authStore.account.name} image={authStore.account.icon} /> : ''}
					</div>
					{coverSelector}
				</div>
			</div>
		);
	};
	
	onCover (e: any) {
		this.setState({ coverSelector: !this.state.coverSelector });
	};

	onProfile (e: any) {
		e.preventDefault();
	};
	
	resize () {
		let win = $(window);
		let node = $(ReactDOM.findDOMNode(this));
		let cover = node.find('#cover');
		let body = node.find('#body');
		let items = node.find('#items');
		let wh = win.height();
		let ww = win.width();
		let cnt = Math.floor((ww - 80) / 160);
		let width = cnt * 160 - 16;
		
		cover.css({ height: wh });
		items.css({ width: width, top: wh - 224, marginLeft: -width / 2 });
		body.css({ width: width, minHeight: wh - 92 });
		
		let n = 1;
		items.find('.indexItem').each((i: number, item: any) => {
			$(item).css({ marginRight: (n % cnt === 0) ? 0 : 16 });
			n++;
		});
	};

};

export default PageMainIndex;