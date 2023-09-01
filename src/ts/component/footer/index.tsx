import * as React from 'react';
import { I, sidebar } from 'Lib';
import { menuStore } from 'Store';

import FooterAuthIndex from './auth';
import FooterMainObject from './main/object';

interface Props extends I.FooterComponent {
	component: string;
	className?: string;
};

const Components = {
	authIndex:			 FooterAuthIndex,
	mainObject:			 FooterMainObject,
};

class Footer extends React.Component<Props> {

	refChild: any = null;

	constructor (props: Props) {
		super(props);

		this.onHelp = this.onHelp.bind(this);
	};
	
	render () {
		const { component, className } = this.props;
		const Component = Components[component] || null;
		const cn = [ 'footer', component, className ];

		return (
			<div id="footer" className={cn.join(' ')}>
				<Component 
					ref={ref => this.refChild = ref} 
					{...this.props} 
					onHelp={this.onHelp}
				/>
			</div>
		);
	};

	componentDidMount () {
		sidebar.resizePage();
	};

	componentDidUpdate () {
		sidebar.resizePage();	
		this.refChild.forceUpdate();
	};

	onHelp () {
		menuStore.open('help', {
			element: '#button-help',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
			offsetY: -4,
		});
	};

};

export default Footer;