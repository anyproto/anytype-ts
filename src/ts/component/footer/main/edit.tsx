import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'Component';
import { I, Util, sidebar } from 'Lib';
import { menuStore, blockStore, commonStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any>  {
	rootId: string;
	isPopup?: boolean;
};

const FooterMainEdit = observer(class FooterMainEdit extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onHelp = this.onHelp.bind(this);
	};

	render () {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		return (
			<div id="footer" className="footer footerMainEdit">
				<Icon 
					id="button-expand" 
					className="big expand" 
					tooltip="Show sidebar" 
					tooltipY={I.MenuDirection.Top} 
					onClick={() => { sidebar.expand(); }} 
				/>

				<Icon 
					id="button-help" 
					className="big help" 
					tooltip="Help" 
					tooltipY={I.MenuDirection.Top} 
					onClick={this.onHelp} 
				/>
			</div>
		);
	};

	componentDidMount () {
		sidebar.resizePage();
	};

	componentDidUpdate () {
		sidebar.resizePage();
	};

	onHelp () {
		menuStore.open('help', {
			element: '#button-help',
			offsetY: -4,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Right,
		});
	};
	
});

export default FooterMainEdit;