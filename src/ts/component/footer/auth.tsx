import * as React from 'react';
import { Icon } from 'ts/component';

class FooterAuth extends React.Component<{}, {}> {

	render () {
        return (
			<div>
				<div className="copy">2018, Anytype</div>
				<Icon id="commonHelp" className="help light" onMouseDown={() => { }} />
			</div>
		);
    };

};

export default FooterAuth;