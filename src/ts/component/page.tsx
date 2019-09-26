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
		const { match } = this.props;
		const Components: any = {
			'/':					 PageAuthSelect,
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
		
		const path = [ match.params.page, match.params.action ].join('/');
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
	
	getClass () {
		const { match } = this.props;
		
		let page = match.params.page || 'index';
		let action = match.params.action || 'index';
		
		return [ 
			'page', 
			'page-' + page, 
			'page-' + page + '-' + action 
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