import * as React from 'react';
import { observer } from 'mobx-react';
import { S } from 'Lib';

const SidebarRight = observer(class SidebarRight extends React.Component {
	
	private _isMounted = false;
	node = null;

	constructor (props) {
		super(props);

	};

    render() {
		const { showSidebarRight } = S.Common;

		if (!showSidebarRight) {
			return null;
		};

        return (
			<div 
				ref={node => this.node = node}
				id="sidebarRight"
				className="sidebar right"
			>
			</div>
		);
    };

	componentDidMount (): void {
		this._isMounted = true;
	};

	componentDidUpdate (): void {
	};

	componentWillUnmount (): void {
		this._isMounted = false;
	};

});

export default SidebarRight;