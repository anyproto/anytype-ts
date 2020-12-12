import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject } from 'ts/component';
import { authStore } from 'ts/store';
import { DataUtil, translate } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	path?: any[];
};

@observer
class HeaderHelpIndex extends React.Component<Props, {}> {

	public static defaultProps = {
		path: [] as any[]
	};

	constructor (props: any) {
		super(props);
		
		this.onHome = this.onHome.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
	};

	render () {
		const { path } = this.props;
		
		const PathItemHome = (item: any) => (
			<div className="item" onClick={this.onHome}>
				<Icon className="home" />
				<div className="name">{translate('commonHome')}</div>
				<Icon className="arrow" />
			</div>
		);
		
		const PathItem = (item: any) => {
			return (
				<div className="item" onClick={(e: any) => { this.onPath(e, item); }}>
					<IconObject object={{ iconEmoji: item.icon }} />
					<div className="name">{item.name}</div>
					<Icon className="arrow" />
				</div>
			);
		};
		
		return (
			<div className="header headerMainEdit">
				<div className="path">
					<Icon className="back" onClick={this.onBack} />
					<Icon className="forward" onClick={this.onForward} />
					<PathItemHome />
					{path.map((item: any, i: any) => (
						<PathItem key={i} {...item} />
					))}
				</div>
			</div>
		);
	};
	
	onHome (e: any) {
		if (authStore.account) {
			this.props.history.push('/main/index');
		} else {
			DataUtil.onAuth();
		};
	};
	
	onBack (e: any) {
		this.props.history.goBack();
	};
	
	onForward (e: any) {
		this.props.history.goForward();
	};
	
	onPath (e: any, item: any) {
		this.props.history.push('/help/index/' + item.contentId);
	};
	
};

export default HeaderHelpIndex;