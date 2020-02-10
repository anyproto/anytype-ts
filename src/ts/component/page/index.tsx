import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Util, Storage } from 'ts/lib';
import { commonStore } from 'ts/store';

import PageAuthSelect from './auth/select';
import PageAuthLogin from './auth/login';
import PageAuthPinSelect from './auth/pin/select';
import PageAuthPinConfirm from './auth/pin/confirm';
import PageAuthPinCheck from './auth/pin/check';
import PageAuthSetup from './auth/setup';
import PageAuthAccountSelect from './auth/account/select';
import PageAuthRegister from './auth/register';
import PageAuthSuccess from './auth/success';

import PageMainIndex from './main/index';
import PageMainEdit from './main/edit';

import PageHelpIndex from './help/index';
import PageHelpShortcuts from './help/shortcuts';

const $ = require('jquery');
const raf = require('raf');

interface Props extends RouteComponentProps<any> {};

class Page extends React.Component<Props, {}> {

	_isMounted: boolean = false;
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
			'auth/pin-check':		 PageAuthPinCheck,
			'auth/setup':			 PageAuthSetup,
			'auth/account-select':	 PageAuthAccountSelect,
			'auth/success':			 PageAuthSuccess,
			
			'main/index':			 PageMainIndex,
			'main/edit':			 PageMainEdit,
			
			'help/index':			 PageHelpIndex,
			'help/shortcuts':		 PageHelpShortcuts,
		};
		
		const path = [ match.params.page, match.params.action ].join('/');
		const Component = Components[path];
		
		if (!Component) {
			return <div>Page component "{path}" not found</div>;
		};
		
		return (
			<div className={this.getClass('page')}>
				<Component ref={(ref: any) => this.childRef = ref} {...this.props} />
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.setBodyClass();
		this.resize();
		this.unbind();
		
		commonStore.popupCloseAll();
		commonStore.menuCloseAll();
		
		$(window).on('resize.page', () => { this.resize(); });
	};

	componentDidUpdate () {
		this.setBodyClass();
		this.resize();
		
		commonStore.popupCloseAll();
		commonStore.menuCloseAll();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('resize.page');
	};
	
	getClass (prefix: string) {
		const { match } = this.props;
		
		let page = match.params.page || 'index';
		let action = match.params.action || 'index';
		
		return [ 
			Util.toCamelCase([ prefix, page ].join('-')),
			Util.toCamelCase([ prefix, page, action ].join('-')) 
		].join(' ');
	};
	
	setBodyClass () {
		$('body').attr({ class: this.getClass('body') });
	};
	
	resize () {
		raf(() => {
			if (!this._isMounted) {
				return;
			};

			if (this.childRef && this.childRef.resize) {
				this.childRef.resize();			
			};			
		});
	};
	
};

export default Page;