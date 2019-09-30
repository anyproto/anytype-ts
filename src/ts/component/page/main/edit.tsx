import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { MenuMain } from 'ts/component';

interface Props extends RouteComponentProps<any> {
};

interface State {
};

class PageMainEdit extends React.Component<Props, State> {
	
	state = {
	};

	constructor (props: any) {
		super(props);
	};
	
	render () {
        return (
			<div>
				<MenuMain />
				<div className="editor">
				</div>
			</div>
		);
	};
	
};

export default PageMainEdit;