import * as React from 'react';
import { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { Label } from 'Component';
import { I, translate } from 'Lib';
import BlockTableOfContents from 'Component/block/tableOfContents';

const SidebarPageToc = observer(forwardRef<HTMLDivElement, I.SidebarPageComponent>((props, ref: any) => {
	return (
			<>
				<div className="head">
					<div className="side left">
						<Label text={translate('sidebarToc')} />
					</div>
				</div>

				<div className="body customScrollbar">
					<div className="section">
						<BlockTableOfContents key="sidebar-toc" block={{ type: I.BlockType.TableOfContents, id: I.BlockType.TableOfContents , content: '' }} {...props} />
					</div>
				</div>
			</>
		);
}));

export default SidebarPageToc;
