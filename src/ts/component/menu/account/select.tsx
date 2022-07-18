import * as React from 'react';
import { Icon, IconObject, Error } from 'ts/component';
import { authStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, C, Util, DataUtil, Storage, translate } from 'ts/lib';

interface Props extends I.Menu {};

interface State {
    error: string;
};

const Errors = require('json/error.json');

const MenuAccountSelect = observer(class MenuAccountSelect extends React.Component<Props, State> {

    state = {
        error: ''
    };

    constructor (props: any) {
        super(props);

        this.onSelect = this.onSelect.bind(this);
        this.onAdd = this.onAdd.bind(this);
    };

    render () {
        const { account, accounts } = authStore;
        const { error } = this.state;

        const Item = (item: any) => (
            <div className={'item ' + (item.id == account.id ? 'active' : '')} onClick={(e) => { this.onSelect(e, item.id); }}>
                <IconObject object={{ ...item, layout: I.ObjectLayout.Human }} size={40} />
                <div className="info">
                    <div className="name">{item.name}</div>
                    <div className="description">
                        <Icon className="check" />{Util.sprintf(translate('menuAccountPeer'), 0, 30)}
                    </div>
                </div>
            </div>
        );

        return (
            <div className="items">
                <Error text={error} />

                {accounts.map((item: I.Account, i: number) => (
                    <Item key={i} {...item} />
                ))}

                <div className="item add" onClick={this.onAdd}>
                    <Icon className="plus" />
                    <div className="name">{translate('menuAccountAdd')}</div>
                </div>
            </div>
        );
    };

    componentDidMount () {
        const { walletPath, accounts } = authStore;
        const phrase = Storage.get('phrase');

        if (!accounts.length) {
            authStore.accountListClear();

            C.WalletRecover(walletPath, phrase, (message: any) => {
                C.AccountRecover((message: any) => {
                    if (message.error.code) {
                        Util.checkError(message.error.code);

                        const error = Errors.AccountCreate[message.error.code] || message.error.description;
                        this.setState({ error });
                    };
                });
            });
        };
    };

    onSelect (e: any, id: string) {
        const { walletPath } = authStore;

        this.props.close();

        C.AccountSelect(id, walletPath, (message: any) => {
            if (message.error.code) {
                Util.checkError(message.error.code);
            } else
            if (message.account) {
                DataUtil.onAuth(message.account);
            };
        });
    };

    onAdd (e: any) {
        Util.route('/auth/register/add');
    };

});

export default MenuAccountSelect;