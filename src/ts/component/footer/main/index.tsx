import * as React from 'react';
import { Icon } from 'Component';
import { I, Storage } from 'Lib';

class FooterMainIndex extends React.Component<I.FooterComponent> {

	render () {
		const { onHelp } = this.props;
		const migrationHint = Storage.get('migrationHint');
		const hintShown = migrationHint && !migrationHint.showHint;

		return (
			<Icon id="button-help" className="help big" tooltip={hintShown ? 'Help' : null} tooltipY={I.MenuDirection.Top} onClick={onHelp} />
		);
	};

};

export default FooterMainIndex;