import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Icon, Smile } from 'ts/component';
import { observer, inject } from 'mobx-react';

interface Props extends RouteComponentProps<any> {
	authStore?: any;
};

@inject('authStore')
@observer
class HeaderMainEdit extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onHome = this.onHome.bind(this);
		this.onPath = this.onPath.bind(this);
		this.onBack = this.onBack.bind(this);
		this.onForward = this.onForward.bind(this);
	};

	render () {
		const { authStore } = this.props;
		const { account } = authStore;
		
		const path = [
			{ id: '2', icon: ':family:', name: 'Contacts' },
		];
		
		const PathItemHome = (item: any) => (
			<div className="item" onClick={this.onHome}>
				<Icon className="home" />
				<div className="name">Home</div>
				<Icon className="arrow" />
			</div>
		);
		
		const PathItem = (item: any) => (
			<div className="item" onClick={(e: any) => { this.onPath(e, item.id); }}>
				<Smile icon={item.icon} />
				<div className="name">{item.name}</div>
				<Icon className="arrow" />
			</div>
		);
		
		return (
			<div className="header headerMainFolder">
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
		this.props.history.push('/main/index');
	};
	
	onPath (e: any, id: string) {
		this.props.history.push('/main/edit/' + id);
	};
	
	onBack (e: any) {
		this.props.history.goBack();
	};
	
	onForward (e: any) {
		this.props.history.goForward();
	};
	
};

export default HeaderMainEdit;