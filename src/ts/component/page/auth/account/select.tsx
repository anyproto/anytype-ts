import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, IconUser, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { observer, inject } from 'mobx-react';
import { authStore } from 'ts/store';
import { AccountInterface } from 'ts/store/auth';

interface Props extends RouteComponentProps<any> {
	authStore?: any;
};
interface State {};

@inject('authStore')
@observer
class PageAccountSelect extends React.Component<Props, State> {

	constructor (props: any) {
        super(props);

		this.onSelect = this.onSelect.bind(this);
	};
	
	render () {
		const { authStore } = this.props;
		
		const Item = (item: AccountInterface) => (
			<div className="item" onClick={this.onSelect}>
				<IconUser {...item} />
				<div className="name">{item.name}</div>
			</div>
		);
		
        return (
			<div>
				<Cover num={3} />
				<Header />
				<Footer />
				
				<Frame>
					<Title text="Choose profile" />
					
					<div className="list">
						{authStore.accounts.map((item: AccountInterface, i: number) => (
							<Item key={i} {...item} />	
						))}
					</div>
				</Frame>
			</div>
		);
    };

	onSelect (e: any) {
		e.preventDefault();
		
		this.props.history.push('/main/index');
	};
	
};

export default PageAccountSelect;