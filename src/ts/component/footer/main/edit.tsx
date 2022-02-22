import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, Util } from 'ts/lib';
import { menuStore, blockStore, commonStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any>  {
	rootId: string;
	isPopup?: boolean;
};

const FooterMainEdit = observer(class FooterMainEdit extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onHelp = this.onHelp.bind(this);
		this.onSidebarExpand = this.onSidebarExpand.bind(this);
	};

	render () {
		const { rootId } = this.props;
		const root = blockStore.getLeaf(rootId, rootId);
		const { sidebar } = commonStore;
		const { fixed } = sidebar;

		if (!root) {
			return null;
		};

		return (
			<div id="footer" className="footer footerMainEdit">
				{!fixed ? (
					<Icon id="button-expand" className="big expand" tooltip="Show sidebar" tooltipY={I.MenuDirection.Top} onClick={this.onSidebarExpand} />
				) : ''}

				<Icon id="button-help" className="big help" tooltip="Help" tooltipY={I.MenuDirection.Top} onClick={this.onHelp} />
			</div>
		);
	};

	componentDidMount () {
		Util.resizeSidebar();
	};

	componentDidUpdate () {
		Util.resizeSidebar();	
	};

	onSidebarExpand () {
		commonStore.sidebarSet({ fixed: true });
		menuStore.close('previewObject');
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