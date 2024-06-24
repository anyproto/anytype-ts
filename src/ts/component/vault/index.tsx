import * as React from 'react';
import { observer } from 'mobx-react';

const Vault = observer(class Vault extends React.Component {
	
	node = null;

	constructor (props) {
		super(props);
	};

    render() {
        return (
            <div 
				ref={node => this.node = node}
				id="vault"
				className="vault"
            >
            </div>
		);
    };

});

export default Vault;