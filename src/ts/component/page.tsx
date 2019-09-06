import * as React from 'react';
import * as ReactDOM from 'react-dom';

import PageAuthCode from './page/auth/code';
import PageAuthNotice from './page/auth/notice';

const $ = require('jquery');

interface Props {
	history: any;
	match: any;
};

const Components: any = {
	"index/index": PageAuthCode,
	
	"auth/code": PageAuthCode,
	"auth/notice": PageAuthNotice 
};

class Page extends React.Component<Props, {}> {

	childRef: any; 

	render () {
		const route = this.getRoute();
		const path = [ route.page, route.action ].join('/');
		const Component = Components[path];
		
		if (!Component) {
			return <div>Page component "{path}" not found</div>;
		};
		
		return (
			<div className={this.getClass()}>
				<Component ref={(ref: any) => this.childRef = ref} {...this.props} />
			</div>
		);
	};
	
	componentDidMount () {
		let win = $(window);
		win.unbind('resize orientationchange');
		win.on('resize orientationchange', () => { this.resize(); });

		this.setBodyClass();
		this.resize();
	};

	componentDidUpdate () {
		this.setBodyClass();
		this.resize();
	};
	
	getRoute () {
		const { match } = this.props;
		
		let a: string[] = match.path.split('/');
		a.shift();
		
		return { page: a[0] || 'index', action: a[1] || 'index' };
	};
	
	getClass () {
		let route: any = this.getRoute();
		return [ 
			'page', 
			'page-' + route.page, 
			'page-' + route.page + '-' + route.action 
		].join(' ');
	};
	
	setBodyClass () {
		$('body').attr({ class: this.getClass() });
	};
	
	resize () {
		if (this.childRef.resize) {
			this.childRef.resize();			
		};
	};
	
};

export default Page;