import * as React from 'react';
import { Icon } from 'Component';
import { I, sidebar } from 'Lib';
import { observer } from 'mobx-react';

interface Props extends I.FooterComponent {};

const FooterMainEdit = observer(class FooterMainEdit extends React.Component<Props, {}> {
	
	render () {
		const { onHelp } = this.props;

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
					onClick={onHelp} 
				/>
			</div>
		);
	};

});

export default FooterMainEdit;