/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RemoteBookDialogModel } from '../../dialog/remoteBookDialogModel';
import { IAsset, RemoteBookController } from '../../book/remoteBookController';
import * as should from 'should';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { MockExtensionContext } from '../common/stubs';
import { AppContext } from '../../common/appContext';
import * as loc from '../../common/localizedConstants';
import { GitHubRemoteBook } from '../../book/githubRemoteBook';
import { RemoteBook } from '../../book/remoteBook';
import * as nock from 'nock';
import * as os from 'os';
import * as fs from 'fs';

describe('Github Remote Book', function () {
	let mockExtensionContext: vscode.ExtensionContext = new MockExtensionContext();
	let appContext = new AppContext(mockExtensionContext);
	let model = new RemoteBookDialogModel();
	let controller = new RemoteBookController(model, appContext.outputChannel);

	afterEach(function (): void {
		sinon.restore();
	});

	it('Verify GitHub Remote Book is created by controller', async function (): Promise<void> {
		let releaseURL = new URL('https://api.github.com/repos/microsoft/test/releases/v1');
		let asset : IAsset = {
			name: 'CU-1.0-EN.zip',
			book: 'CU',
			version: '1.0',
			language: 'EN',
			format: 'zip',
			url: new URL('https://api.github.com/repos/microsoft/test/releases/v1/assets/1'),
			browserDownloadUrl: new URL('https://github.com/microsoft/test/releases/download/v1/CU-1.0-EN.zip'),
		}
		let remoteLocation = loc.onGitHub;
		controller.setRemoteBook(releaseURL, remoteLocation, asset);
		should(controller.model.remoteBook).not.null();
		should(controller.model.remoteBook instanceof GitHubRemoteBook).be.true;
	});

	it('Verify set local path is called when creating a GitHub Remote Book', async function (): Promise<void> {
		let releaseURL = new URL('https://api.github.com/repos/microsoft/test/releases/v1');
		let asset : IAsset = {
			name: 'CU-1.0-EN.zip',
			book: 'CU',
			version: '1.0',
			language: 'EN',
			format: 'zip',
			url: new URL('https://api.github.com/repos/microsoft/test/releases/v1/assets/1'),
			browserDownloadUrl: new URL('https://github.com/microsoft/test/releases/download/v1/CU-1.0-EN.zip'),
		}
		let remoteLocation = loc.onGitHub;
		const createCopySpy = sinon.spy(GitHubRemoteBook.prototype, 'createLocalCopy');
		const setPathSpy = sinon.spy(RemoteBook.prototype, 'setLocalPath');
		controller.setRemoteBook(releaseURL, remoteLocation, asset);
		should(createCopySpy.calledOnce).be.true;
		should(setPathSpy.calledOnce).be.true;
	});

	it('Should download contents from Github', async function (): Promise<void> {
		let releaseURL = new URL('https://api.github.com/repos/microsoft/test/releases/v1');
		let asset : IAsset = {
			name: 'CU-1.0-EN.zip',
			book: 'CU',
			version: '1.0',
			language: 'EN',
			format: 'zip',
			url: new URL('https://api.github.com/repos/microsoft/test/releases/v1/assets/1'),
			browserDownloadUrl: new URL('https://github.com/microsoft/test/releases/download/v1/CU-1.0-EN.zip'),
		}
		let remoteLocation = loc.onGitHub;
		controller.setRemoteBook(releaseURL, remoteLocation, asset);

		model.remoteBook.localPath = new URL(os.tmpdir());
		let setPathStub = sinon.stub(GitHubRemoteBook.prototype, 'setLocalPath');
		setPathStub.callsFake(function() {
			console.log(`Downloading book in ${model.remoteBook.localPath}`);
		})
		const setExtractSpy = sinon.spy(GitHubRemoteBook.prototype, 'extractFiles');
		nock('https://github.com')
				.persist()
				.get('/microsoft/test/releases/download/v1/CU-1.0-EN.zip')
				.replyWithFile(200, __filename);
		await model.remoteBook.createLocalCopy();
		should(setExtractSpy.calledOnceWith(new URL(model.remoteBook.localPath.href)));
		await fs.promises.stat(model.remoteBook.localPath.href);
	});

	it('Should reject if error', async function (): Promise<void> {
		nock('https://github.com')
				.persist()
				.get('/microsoft/test/releases/download/v1/CU-1.0-EN.zip')
				.replyWithError(new Error('Unexpected Error'));
		const createLocalCopy =  model.remoteBook.createLocalCopy();
		await should(createLocalCopy).be.rejected();
	});

	it('Should reject if response status code is not 200', async function (): Promise<void> {
		nock('https://github.com')
				.persist()
				.get('/microsoft/test/releases/download/v1/CU-1.0-EN.zip')
				.reply(404)
		const createLocalCopy =  model.remoteBook.createLocalCopy();
		await should(createLocalCopy).be.rejected;
	});
});
