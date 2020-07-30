/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./media/selectImageDialog';
import { attachButtonStyler } from 'sql/platform/theme/common/styler';
import { SelectBox } from 'sql/base/browser/ui/selectBox/selectBox';
import { Modal } from 'sql/workbench/browser/modal/modal';
import * as TelemetryKeys from 'sql/platform/telemetry/common/telemetryKeys';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { localize } from 'vs/nls';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';
import * as DOM from 'vs/base/browser/dom';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { ILogService } from 'vs/platform/log/common/log';
import { ITextResourcePropertiesService } from 'vs/editor/common/services/textResourceConfigurationService';
import { IAdsTelemetryService } from 'sql/platform/telemetry/common/telemetry';
import { attachModalDialogStyler } from 'sql/workbench/common/styler';
import { ILayoutService } from 'vs/platform/layout/browser/layoutService';
import { Deferred } from 'sql/base/common/promise';
import { InputBox } from 'sql/base/browser/ui/inputBox/inputBox';

export class SelectImageDialog extends Modal {
	private _selectionComplete: Deferred<string[]>;
	private _imageTypeSelectBox: SelectBox;
	private _imagePathInputBox: InputBox;

	private readonly localImageLabel = localize('selectImageDialog.localImage', "Local");
	private readonly remoteImageLabel = localize('selectImageDialog.removeImage', "Remote");

	constructor(
		@IThemeService themeService: IThemeService,
		@ILayoutService layoutService: ILayoutService,
		@IAdsTelemetryService telemetryService: IAdsTelemetryService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IContextViewService private contextViewService: IContextViewService,
		@IClipboardService clipboardService: IClipboardService,
		@ILogService logService: ILogService,
		@ITextResourcePropertiesService textResourcePropertiesService: ITextResourcePropertiesService
	) {
		super(
			localize('selectImageDialog.title', "Add image"),
			TelemetryKeys.SelectImage,
			telemetryService,
			layoutService,
			clipboardService,
			themeService,
			logService,
			textResourcePropertiesService,
			contextKeyService,
			undefined);
		this._selectionComplete = new Deferred<string[]>();
	}

	/**
	 * Opens the dialog and returns a promise for what options the user chooses.
	 */
	public open(): Promise<string[]> {
		this.show();
		return this._selectionComplete.promise;
	}

	public render() {
		super.render();
		attachModalDialogStyler(this, this._themeService);

		let okButton = this.addFooterButton(localize('selectImageDialog.ok', "OK"), () => this.ok());
		attachButtonStyler(okButton, this._themeService);

		let cancelButton = this.addFooterButton(localize('selectImageDialog.cancel', "Cancel"), () => this.cancel());
		attachButtonStyler(cancelButton, this._themeService);
	}

	protected renderBody(container: HTMLElement) {
		const body = DOM.append(container, DOM.$('div.select-image-dialog'));

		let description = DOM.$('div.select-image-row');
		description.innerText = localize('selectImageDialog.description', "Select local or remote image to add to your notebook.");
		DOM.append(body, description);

		let selectBoxLabel = DOM.$('div.select-image-label.select-image-row');
		selectBoxLabel.innerText = localize('selectImageDialog.locationLabel', "Image location");
		DOM.append(body, selectBoxLabel);

		let selectBoxContainer = DOM.$('div.select-image-input.select-image-row');
		let typeOptions = [this.localImageLabel, this.remoteImageLabel];
		this._imageTypeSelectBox = new SelectBox(typeOptions, typeOptions[0], this.contextViewService);
		this._imageTypeSelectBox.render(selectBoxContainer);
		DOM.append(body, selectBoxContainer);

		let inputBoxLabel = DOM.$('div.select-image-label.select-image-row');
		inputBoxLabel.innerText = localize('selectImageDialog.pathLabel', "Image path");
		DOM.append(body, inputBoxLabel);

		const inputBoxContainer = DOM.append(body, DOM.$('div.select-image-input.select-image-row'));
		this._imagePathInputBox = new InputBox(DOM.append(inputBoxContainer, DOM.$('div.select-image-input')), this.contextViewService);
	}

	protected layout(height?: number): void {
	}

	public ok() {
		this.hide();
		this._selectionComplete.resolve([`<img src="${this._imagePathInputBox.value}">`]);
	}

	public cancel() {
		this.hide();
		this._selectionComplete.resolve(['', '']);
	}
}
