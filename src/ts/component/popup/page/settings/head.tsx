import * as React from 'react';
import { Icon } from 'ts/component';

interface Props {
	id: string;
	prevPage: string;
	name: string;
	onPage: (id: string) => void;
};

class PopupSettingsHead extends React.Component<Props, {}> {

	render () {
		const { id, name, prevPage, onPage } = this.props;

		return (
			<div className="head">
				<div className="element" onClick={() => { onPage(id || prevPage); }}>
					<Icon className="back" />
					{name}
				</div>
			</div>
		);
	};

	

};

export default PopupSettingsHead;