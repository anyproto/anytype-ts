import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Frame, Cover, Title, Label, Error, Input, Button, Smile, HeaderAuth as Header, FooterAuth as Footer } from 'ts/component';
import { dispatcher } from 'ts/lib';

interface Props extends RouteComponentProps<any> {};
interface State {
	icon: number;
};

const Icons: number[] = [
	12, 1230, 1, 130, 2, 230, 3, 330, 4, 430, 5, 530, 6, 630, 7, 730, 8, 830, 9, 930, 10, 1030, 11, 1130
];

class PageAuthSetup extends React.Component<Props, State> {

	i: number = 0;
	t: number = 0;
	state = {
		icon: 0
	};

	render () {
		const { icon } = this.state;
		
        return (
			<div>
				<Cover num={3} />
				<Header />
				<Footer />
				
				<Frame>
					<Smile icon={':clock' + Icons[icon] + ':'} size={36} />
					<Title text="Setting up the wallet..." />
				</Frame>
			</div>
		);
    };

	componentDidMount () {
		const { match } = this.props;
		
		this.clear();
		this.i = window.setInterval(() => {
			let { icon } = this.state;
			
			icon++;
			if (icon >= Icons.length) {
				icon = 0;
			};
			
			this.setState({ icon: icon });
		}, 1000);
		
		if (match.params.id == 'register') {
			dispatcher.call('walletCreate', { pin: 'test' }, (message: any) => {
				this.props.history.push('/auth/register');
			});
		};
		
		if (match.params.id == 'login') {
			this.t = window.setTimeout(() => {
				this.props.history.push('/auth/account-select');
			}, 3000);
		};
	};
	
	componentWillUnmount () {
		this.clear();
	};
	
	clear () {
		clearInterval(this.i);
		clearTimeout(this.t);
	};

};

export default PageAuthSetup;