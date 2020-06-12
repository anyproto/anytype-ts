import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Smile } from 'ts/component';
import { authStore } from 'ts/store';
import { DataUtil } from 'ts/lib';
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
				<div className="name">Home</div>
				<Icon className="arrow" />
			</div>
		);
		
		const PathItem = (item: any) => {
			return (
				<div className="item" onClick={(e: any) => { this.onPath(e, item); }}>
					<Smile icon={item.icon} />
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
			DataUtil.onAuth();
		} else {
			this.props.history.push('/');
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