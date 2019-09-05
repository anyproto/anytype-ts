import * as React from 'react';

interface Props {
	history: any;
};

interface State { 
};

class PageAuthCode extends React.Component<Props, State> {
    
	render () {
        return (
			<div className="frame">
				Page auth/code
			</div>
		);
    };

};

export default PageAuthCode;