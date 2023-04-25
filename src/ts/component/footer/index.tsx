import * as React from 'react';
import { I, Preview, sidebar, Storage } from 'Lib';
import { menuStore } from 'Store';

import FooterAuthIndex from './auth';
import FooterMainIndex from './main/index';
import FooterMainEdit from './main/edit';

interface Props extends I.FooterComponent {
	component: string;
};

const Components = {
	authIndex:			 FooterAuthIndex,
	mainIndex:			 FooterMainIndex,
	mainEdit:			 FooterMainEdit,
};

class Footer extends React.Component<Props> {

	refChild: any = null;

	constructor (props: Props) {
		super(props);

		this.onHelp = this.onHelp.bind(this);
	};
	
	render () {
		const { component } = this.props;
		const Component = Components[component] || null;
		const cn = [ 'footer', component ];

		return (
			<div id="footer" className={cn.join(' ')}>
				<Component 
					ref={(ref: any) => this.refChild = ref} 
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
			onClose: () => {
				const migrationHint = Storage.get('migrationHint') || {};

				if (migrationHint.showHint) {
					Preview.showMigrationTooltip();
				};
			}

		});
	};

};

export default Footer;