import * as React from 'react';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

@observer
class MenuDataviewFilterValues extends React.Component<Props, {}> {

	_isMounted: boolean = false;

	constructor (props: any) {
		super(props);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId } = data;

		return (
			<div className="items">
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};

	componentWillUnmount () {
		this._isMounted = false;
    };
    
};

export default MenuDataviewFilterValues;