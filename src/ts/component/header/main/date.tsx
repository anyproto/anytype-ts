import * as React from 'react';
import { observer } from 'mobx-react';
import { Sync } from 'Component';
import { I, S, U, J } from 'Lib';

interface State {
	templatesCnt: number;
};

const HeaderMainDate = observer(class HeaderMainObject extends React.Component<I.HeaderComponent, State> {
	render () {
		const { rootId } = this.props;
		const root = S.Block.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};

		const object = S.Detail.get(rootId, rootId, J.Relation.template);
		const isTypeOrRelation = U.Object.isTypeOrRelationLayout(object.layout);
		const showMenu = !isTypeOrRelation;
		const canSync = showMenu && !object.templateIsBundled && !U.Object.isParticipantLayout(object.layout);

		return (
			<React.Fragment>
				<div className="side left">
                {canSync ? <Sync id="button-header-sync" onClick={this.onSync} /> : ''}
				</div>

				<div className="side center">
				</div>

				<div className="side right">
				</div>
			</React.Fragment>
		);
	};

	onSync = () => {
		const { rootId, menuOpen } = this.props;

		menuOpen('syncStatus', '#button-header-sync', {
			subIds: [ 'syncStatusInfo' ],
			data: {
				rootId,
			}
		});
	};

});

export default HeaderMainDate;
