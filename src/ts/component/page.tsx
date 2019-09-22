import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { 
	PageAuthSelect, PageAuthRegister, PageAuthLogin, PageAuthPinSelect, PageAuthPinConfirm, 
	PageAuthSetup, PageAuthAccountSelect, PageAuthSuccess, PageMainIndex 
} from '.';

const $ = require('jquery');

interface Props extends RouteComponentProps<any> {};
interface Route {
	page: string; 
	action: string;
	id: string;
};

class Page extends React.Component<Props, {}> {

	childRef: any;

	render () {
		const Components: any = {
			'index/index':			 PageAuthSelect,
			
			'auth/select':			 PageAuthSelect,
			'auth/register':		 PageAuthRegister,
			'auth/login':			 PageAuthLogin,
			'auth/pin-select':		 PageAuthPinSelect,
			'auth/pin-confirm':		 PageAuthPinConfirm,
			'auth/setup':			 PageAuthSetup,
			'auth/account-select':	 PageAuthAccountSelect,
			'auth/success':			 PageAuthSuccess,
			
			'main/index':			 PageMainIndex,
		};
		
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
		win.unbind('resize.page orientationchange.page');
		win.on('resize.page orientationchange.page', () => { this.resize(); });

		this.setBodyClass();
		this.resize();
	};

	componentDidUpdate () {
		this.setBodyClass();
		this.resize();
	};
	
	getRoute (): Route {
		const { match } = this.props;
		let a: string[] = match.path.split('/');

		a.shift();
		return { 
			page: a[0] || 'index', 
			action: a[1] || 'index',
			id: a[2] || '',
		};
	};
	
	getClass () {
		let route: Route = this.getRoute();
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
		if (this.childRef && this.childRef.resize) {
			this.childRef.resize();			
		};
	};
	
};

export default Page;