import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject } from 'ts/component';
import { I, Util, DataUtil } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
};

const $ = require('jquery');

@observer
class HeaderMainEditPopup extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onOpen = this.onOpen.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onRelation = this.onRelation.bind(this);
	};

	render () {
		const { rootId } = this.props;
		const { breadcrumbs } = blockStore;
		const { config } = commonStore;
		const root = blockStore.getLeaf(rootId, rootId);

		if (!root) {
			return null;
		};
		
		const details = blockStore.getDetails(breadcrumbs, rootId);

		return (
			<div id="header" className="header headerMainEdit">
				<div className="side left">
					<div className="item" onClick={this.onOpen}>
						<Icon className="expand" />
						Open as page
					</div>
				</div>

				<div className="side center">
					<div className="path">
						<div className="item">
							<IconObject object={details} />
							<div className="name">{Util.shorten(details.name, 32)}</div>
						</div>
					</div>
					{config.allowDataview ? (
						<Icon id="button-header-relation" tooltip="Relations" menuId="blockRelationList" className="relation big" onClick={this.onRelation} />
					) : ''}
				</div>

				<div className="side right">
					<Icon id="button-header-more" tooltip="Menu" className="more big" onClick={this.onMore} />
				</div>
			</div>
		);
	};

	onOpen () {
		const { rootId } = this.props;
		DataUtil.pageOpen(rootId);
	};

	onMore (e: any) {
		const { rootId, match } = this.props;
		
		commonStore.menuOpen('blockMore', { 
			element: '#popupEditorPage #button-header-more',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 8,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			data: {
				rootId: rootId,
				blockId: rootId,
				blockIds: [ rootId ],
				match: match,
			}
		});
	};

	onRelation () {
		const { rootId } = this.props;

		commonStore.menuOpen('blockRelationView', { 
			element: '#popupEditorPage #button-header-relation',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			noFlipY: true,
			data: {
				relationKey: '',
				readOnly: false,
				rootId: rootId,
			},
		});
	};

};

export default HeaderMainEditPopup;