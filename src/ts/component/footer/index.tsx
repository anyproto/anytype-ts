import * as React from 'react';
import { I, S, sidebar } from 'Lib';

import FooterAuthIndex from './auth';
import FooterAuthDisclaimer from './auth/disclaimer';
import FooterMainObject from './main/object';

interface Props extends I.FooterComponent {
	component: string;
	className?: string;
};

const Components = {
	authIndex:			 FooterAuthIndex,
	authDisclaimer:		 FooterAuthDisclaimer,
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
		sidebar.resizePage(null, false);
	};

	componentDidUpdate () {
		sidebar.resizePage(null, false);	
		this.refChild.forceUpdate();
	};

	onHelp () {
		S.Menu.open('help', {
			element: '#footer #button-help',
			classNameWrap: 'fixed',
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
			offsetY: () => -($('#notifications').height() + 78),
		});
	};

};

export default Footer;
