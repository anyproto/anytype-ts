import * as React from 'react';
import { Icon } from 'Component';
import { I, sidebar } from 'Lib';
import { observer } from 'mobx-react';

const FooterMainEdit = observer(class FooterMainEdit extends React.Component<I.FooterComponent> {
	
	render () {
		const { onHelp } = this.props;

		return (
			<React.Fragment>
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
			</React.Fragment>
		);
	};

});

export default FooterMainEdit;