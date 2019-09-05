import * as React from 'react';

interface Props { 
	history: any;
};

interface State { 
};

class PageAuthNotice extends React.Component<Props, State> {
    
	render () {
        return (
			<div className="frame">
				Page auth/notice
			</div>
		);
    };

};

export default PageAuthNotice;