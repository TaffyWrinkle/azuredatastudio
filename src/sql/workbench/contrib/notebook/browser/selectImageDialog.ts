/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IThemeService } from 'vs/platform/theme/common/themeService';
import { localize } from 'vs/nls';
import { Modal } from 'sql/workbench/browser/modal/modal';
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService';
import { IAdsTelemetryService } from 'sql/platform/telemetry/common/telemetry';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { ILogService } from 'vs/platform/log/common/log';
import { ITextResourcePropertiesService } from 'vs/editor/common/services/textResourceConfigurationService';
import { attachModalDialogStyler } from 'sql/workbench/common/styler';
import { attachButtonStyler } from 'vs/platform/theme/common/styler';
import { Deferred } from 'sql/base/common/promise';
import * as TelemetryKeys from 'sql/platform/telemetry/common/telemetryKeys';
import * as DOM from 'vs/base/browser/dom';
import * as DialogHelper from 'sql/workbench/browser/modal/dialogHelper';
import { SelectBox } from 'sql/base/browser/ui/selectBox/selectBox';
import { IContextViewService } from 'vs/platform/contextview/browser/contextView';

export class SelectImageDialog extends Modal {
	private _selectionComplete: Deferred<string[]>;
	private _imageTypeSelectBox: SelectBox;

	private readonly imageLinkLabel = localize('selectImageDialog.imageLink', "Image link");
	private readonly embedImageLabel = localize('selectImageDialog.embeddedImage', "Embedded image");

	constructor(
		@IWorkbenchLayoutService layoutService: IWorkbenchLayoutService,
		@IThemeService themeService: IThemeService,
		@IAdsTelemetryService telemetryService: IAdsTelemetryService,
		@IContextKeyService contextKeyService: IContextKeyService,
		@IClipboardService clipboardService: IClipboardService,
		@ILogService logService: ILogService,
		@ITextResourcePropertiesService textResourcePropertiesService: ITextResourcePropertiesService,
		@IContextViewService private contextViewService: IContextViewService
	) {
		super(localize('selectImageDialog.title', "Select image type"), TelemetryKeys.SelectImage, telemetryService, layoutService, clipboardService, themeService, logService, textResourcePropertiesService, contextKeyService, undefined);
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
		let typeOptions = [this.imageLinkLabel, this.embedImageLabel];

		let typeLabel = localize('selectImageDialog.type', "Image link type");
		this._imageTypeSelectBox = new SelectBox(typeOptions, typeOptions[0], this.contextViewService, undefined, { ariaLabel: typeLabel });
		let row = DialogHelper.appendRow(body, typeLabel, 'selectImage-label', 'selectImage-input');
		DialogHelper.appendInputSelectBox(row, this._imageTypeSelectBox);

		const linkImageContainer = DOM.append(body, DOM.$('div'));
		DOM.append(linkImageContainer, DOM.$('div'));

		const embedImageContainer = DOM.append(body, DOM.$('div'));
		DOM.append(embedImageContainer, DOM.$('div'));
	}

	protected layout(height?: number): void {
	}

	public ok() {
		this.hide();
		let imageType = this._imageTypeSelectBox.value;
		if (imageType === this.imageLinkLabel) {
			this._selectionComplete.resolve(['<a href=" ">', '</a>']);
		} else {
			this._selectionComplete.resolve(['<img src=" " alt="', '">']);
		}
	}

	public cancel() {
		this.hide();
		this._selectionComplete.resolve(['', '']);
	}
}
