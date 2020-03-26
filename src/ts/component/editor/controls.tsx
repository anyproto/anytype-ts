import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon } from 'ts/component';
import { I, C } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
};

@observer
class Controls extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onAddIcon = this.onAddIcon.bind(this);
		this.onAddCover = this.onAddCover.bind(this);
	};

	render (): any {
		
		
		return (
			<div className="controls">
				<div className="sides">
					<div className="side left">
						<div id="button-add-icon" className="btn addIcon" onClick={this.onAddIcon}>
							<Icon />
							<div className="txt">Add icon</div>
						</div>
					</div>
					
					<div className="side right">
						<div className="btn addCover" onClick={this.onAddCover}>
							<Icon />
							<div className="txt">Add cover image</div>
						</div>
					</div>
				</div>
			</div>
		);
	};
	
	onAddIcon (e: any) {
		const { rootId } = this.props;
		
		commonStore.menuOpen('smile', { 
			element: '#button-add-icon',
			type: I.MenuType.Vertical,
			offsetX: 0,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				onSelect: (icon: string) => {
					C.BlockSetDetails(rootId, [ 
						{ key: 'icon', value: (icon ? ':' + icon + ':' : '') } 
					]);
				}
			}
		});
	};
	
	onAddCover (e: any) {
		
	};
	
};

export default Controls;