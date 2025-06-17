import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Label } from 'Component';
import { I, S, U, translate, Storage, analytics } from 'Lib';
import BlockTableOfContents from 'Component/block/tableOfContents';

const SidebarPageToc = observer(class SidebarPageToc extends React.Component<I.SidebarPageComponent, {}> {
	
	sectionRefs: Map<string, any> = new Map();

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.getObject = this.getObject.bind(this);
		this.onToggle = this.onToggle.bind(this);
	};

    render () {
        return (
			<>
				<div className="head">
					<div className="side left">
						<Label text={translate('sidebarToc')} />
					</div>
				</div>

				<div className="body customScrollbar">
				<div className="section">
					<BlockTableOfContents key="sidebar-toc" block={{ type: I.BlockType.TableOfContents, id: I.BlockType.TableOfContents , content: '' }} {...this.props} />
				</div>
				</div>
			</>
		);
	};

	componentDidMount () {
		analytics.event('ScreenObjectToc');
	};

	getObject () {
		const { rootId } = this.props;
		return S.Detail.get(rootId, rootId);
	};


	onToggle (id: string) {
		const { page } = this.props;
		const obj = $(`#sidebarRight #sidebarToc-${id}`);
		const title = obj.find('.titleWrap');
		const list = obj.find('> .list');
		const isOpen = list.hasClass('isOpen');

		U.Common.toggle(list, 200);
		title.toggleClass('isOpen', !isOpen);
		Storage.setToggle(page, id, !isOpen);

		analytics.event('ScreenObjectTocToggle', { type: isOpen ? 'Collapse' : 'Extend' });
	};

});

export default SidebarPageToc;
