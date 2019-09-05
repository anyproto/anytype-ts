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
	"index": PageAuthCode,
	"auth/code": PageAuthCode,
	"auth/notice": PageAuthNotice 
};

class Page extends React.Component<Props, {}> {

	render () {
		const { match, history } = this.props;
		
		let path: string = this.getRouteCode();
		
		const Component = Components[path];
		if (!Component) {
			return <div>Page component "{path}" not found</div>;
		};

		let cn: string = path.replace('/', '-');
		let className = [ 'page', 'page-' + cn ].join(' ');
		
		return (
			<div className={className}>
				<Component ref="page" {...this.props} />
			</div>
		);
	};
	
	componentDidMount () {
		let win = $(window);

		this.resize();
		win.unbind('resize orientationchange');
		win.on('resize orientationchange', () => { this.resize(); });

		this.setBodyClass();
	};

	componentDidUpdate () {
		this.setBodyClass();
		this.resize();
	};
	
	getRouteCode () {
		const { match } = this.props;
		
		let a: string[] = match.path.split('/');
		a.shift();
		return a.length > 1 ? [ a[0], a[1] ].join('/') : 'index';
	};
	
	setBodyClass () {
		let path: string = this.getRouteCode();
		let cn: string = path.replace('/', '-');
		let body: any = $('body');
		let className: string = [ 'page', 'page-' + cn ].join(' ');
		
		body.attr({ class: className });
	};
	
	resize () {
	};
	
};

export default Page;