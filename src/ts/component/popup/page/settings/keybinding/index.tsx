import * as React from 'react';
import { Title, Button, Switch } from 'Component';
import {
	I,
	translate,
	ShortcutActionList,
} from 'Lib';
import { popupStore } from 'Store';
import { observer } from 'mobx-react';
import { keybindStore } from 'Store/keybind';

const PopupSettingsPageKeybindingIndex = observer(class PopupSettingsPageKeybindingIndex extends React.Component<I.PopupSettings> {
	constructor(props: I.PopupSettings) {
		super(props);
	}
	render() {
		const shortcutEntries = Object.entries(ShortcutActionList);

		return (
			<React.Fragment>
				<Title text={translate('popupSettingsKeybindingTitle')} />

				<div className="section">
					<div className="items">
						<table>
							<thead>
								<tr>
									<th className="columnSpace">Keybind</th>
									<th>Description</th>
									<th>Override</th>
									<th>Enabled</th>
								</tr>
							</thead>
							<tbody>
								{shortcutEntries.map(([action, { defaultShortcuts, isFixedKeybind, description }]) => (
									<tr key={action} aria-disabled={isFixedKeybind}>
										<td className="key">{defaultShortcuts.join(', ')}</td>
										<td className="descr">{description}</td>
										<td>
											{(keybindStore.userShortcuts.get(action) ?
												keybindStore.userShortcuts.get(action).userSetShortcuts[0] :
												<Button
													color="blank"
													className={['c32', isFixedKeybind ? 'disabled' : ''].join(' ')}
													text={translate('popupSettingsKeybindingOverrideButton')}
													onClick={() => this.onChangeBinding(action)}
												/>
											)}
										</td>
										<td>
											<Switch className={['small', isFixedKeybind ? 'disabled' : ''].join(' ')}
												value={true} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</React.Fragment>
		);
	};

	onChangeBinding(action: string) {
		popupStore.open('shortcutPrompt', {
			data: {
				icon: 'keybinding',
				title: 'Change Keybinding',
				textConfirm: 'Confirm',
				onChange: (shortcut: string) => {
					keybindStore.setUserShortcuts(action, {
						userSetShortcuts: [shortcut],
					});
					console.log('change binding outside ', keybindStore.userShortcuts);
				}
			},
		});
	}

	checkConflict(shortcut: string) {
		const conflict = false;
		if (conflict) {
			return true;
		}
		return false;
	}
});

export default PopupSettingsPageKeybindingIndex;
