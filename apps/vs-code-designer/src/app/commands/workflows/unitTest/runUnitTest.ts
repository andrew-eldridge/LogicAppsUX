/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { defaultExtensionBundlePathValue, runUnitTestEvent, testResultsDirectoryName } from '../../../../constants';
import { ext } from '../../../../extensionVariables';
import { localize } from '../../../../localize';
import { getLatestUnitTest, getTestsDirectory, getUnitTestName, pickUnitTest } from '../../../utils/unitTests';
import { type IActionContext, callWithTelemetryAndErrorHandling } from '@microsoft/vscode-azext-utils';
import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { getWorkspacePath, isMultiRootWorkspace } from '../../../utils/workspace';
import { getLatestBundleVersion } from '../../../utils/bundleFeed';
import { activateAzurite } from '../../../utils/azurite/activateAzurite';
import type { TestFile } from '../../../tree/unitTestTree/testFile';
import type { UnitTestExecutionResult } from '@microsoft/vscode-extension-logic-apps';

/**
 * Runs a unit test for a given node in the Logic Apps designer.
 * @param context - The action context.
 * @param node - The URI representing the node to run the unit test for.
 */
export async function runUnitTest(context: IActionContext, node: vscode.Uri): Promise<void> {
  let unitTestPath: string;
  if (node && node instanceof vscode.Uri) {
    unitTestPath = node.fsPath;
  } else if (isMultiRootWorkspace()) {
    const testsDirectory = getTestsDirectory(vscode.workspace.workspaceFolders[0].uri.fsPath);
    const unitTest = await pickUnitTest(context, testsDirectory.fsPath);
    unitTestPath = (vscode.Uri.file(unitTest.data) as vscode.Uri).fsPath;
  } else {
    throw new Error(localize('expectedWorkspace', 'In order to run unit tests, you must have a workspace open.'));
  }

  const workspaceName = unitTestPath.split(path.sep).slice(-5)[0];
  const workflowName = path.basename(path.dirname(unitTestPath));
  const unitTestFileName = path.basename(unitTestPath);

  const workspaceItem = ext.unitTestController.items.get(workspaceName);
  const workflowItem = workspaceItem?.children.get(`${workspaceName}/${workflowName}`);
  const testItem = workflowItem?.children.get(`${workspaceName}/${workflowName}/${unitTestFileName}`);
  const testFile = ext.testData.get(testItem) as TestFile;

  if (testFile) {
    // test item exists in test blade, update test blade with result
    const simRequest = new vscode.TestRunRequest([testItem]);
    const run = ext.unitTestController.createTestRun(simRequest, localize('runLogicApps', 'Run logic apps standard'), true);

    run.appendOutput(`Running ${testItem.label}\r\n`);
    if (run.token.isCancellationRequested) {
      run.skipped(testItem);
    } else {
      run.started(testItem);
      await testFile.run(testItem, run, context);
    }

    run.appendOutput(`Completed ${testItem.label}\r\n`);
    run.end();
  } else {
    // test item doesn't exist in test blade, run without updating test blade result
    await runUnitTestFromPath(context, unitTestPath);
  }
}

/**
 * Runs a unit test for a given unit test item in the Logic Apps designer.
 * @param {IActionContext} context -  The action context.
 * @param {string} unitTestPath - The filesystem path to the unit test file.
 * @returns A Promise that resolves to the UnitTestResult object.
 */
export async function runUnitTestFromPath(context: IActionContext, unitTestPath: string): Promise<UnitTestExecutionResult> {
  return await callWithTelemetryAndErrorHandling(runUnitTestEvent, async () => {
    const options: vscode.ProgressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: localize('azureFunctions.runUnitTest', 'Running Unit Test...'),
    };

    await activateAzurite(context);

    return await vscode.window.withProgress(options, async (progress, token) => {
      token.onCancellationRequested(() => {
        // Handle cancellation logic
        context.telemetry.properties.canceledRun = 'true';
        ext.outputChannel.appendLine(localize('canceledRunUnitTest', 'Run unit test was canceled'));
      });

      const start = Date.now();
      try {
        const testsDirectory = getTestsDirectory(vscode.workspace.workspaceFolders[0].uri.fsPath);

        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
        const duration = Date.now() - start;

        const testDirectory = getWorkspacePath(unitTestPath);
        const logicAppName = path.relative(testDirectory, unitTestPath).split(path.sep)[0];
        const workflowName = path.basename(path.dirname(unitTestPath));
        const unitTestName = getUnitTestName(path.basename(unitTestPath));
        const bundleVersionNumber = await getLatestBundleVersion(defaultExtensionBundlePathValue);
        const pathToExe = path.join(
          defaultExtensionBundlePathValue,
          bundleVersionNumber,
          'UnitTestExecutor',
          'Microsoft.Azure.Workflows.UnitTestExecutor.exe'
        );

        const { cmdOutput, cmdOutputIncludingStderr } = await new Promise<{ cmdOutput: string; cmdOutputIncludingStderr: string }>(
          (resolve, reject) => {
            let cmdOutput = '';
            let cmdOutputIncludingStderr = '';
            const childProc: cp.ChildProcess = cp.spawn(pathToExe, [
              '-PathToRootFolder',
              path.dirname(testDirectory),
              '-logicAppName',
              logicAppName,
              '-workflowName',
              workflowName,
              '-unitTestName',
              unitTestName,
            ]);

            childProc.stdout.on('data', (data: string | Buffer) => {
              data = data.toString();
              cmdOutput = cmdOutput.concat(data);
            });

            childProc.stderr.on('data', (data: string | Buffer) => {
              data = data.toString();
              cmdOutputIncludingStderr = cmdOutputIncludingStderr.concat(data);
            });

            childProc.on('error', reject);
            childProc.on('close', (code: number) => {
              if (code === 0) {
                resolve({
                  cmdOutput,
                  cmdOutputIncludingStderr,
                });
              } else {
                reject(new Error(`Process exited with code ${code}\n${cmdOutputIncludingStderr}`));
              }
            });
          }
        );
        progress.report({ increment: 100 });

        ext.outputChannel.appendLine(cmdOutput);
        ext.outputChannel.appendLine(cmdOutputIncludingStderr);
        context.telemetry.properties.unitTestCommandOut = cmdOutput;
        context.telemetry.properties.cmdOutputIncludingStderr = cmdOutput;
        context.telemetry.properties.sucessUnitTest = 'true';

        const projectName = path.relative(testsDirectory.fsPath, path.dirname(unitTestPath));
        const testResultsDirectory = path.join(testsDirectory.fsPath, testResultsDirectoryName, projectName, `${unitTestName}.unit-test`);
        const latestUnitTest = await getLatestUnitTest(testResultsDirectory);
        const testResult = {
          isSuccessful: latestUnitTest.data.Results.OverallStatus,
          duration,
        };
        vscode.window.showInformationMessage(localize('unitTestExecuted', 'Unit test results "{0}" was created.', latestUnitTest.label));

        ext.testRuns.set(unitTestPath, {
          unitTestPath,
          results: testResult,
        });

        return testResult;
      } catch (error) {
        vscode.window.showErrorMessage(`${localize('runFailure', 'Error Running Unit Test.')} ${error.message}`, localize('OK', 'OK'));
        context.telemetry.properties.errorMessage = error.message;
        context.telemetry.properties.sucessUnitTest = 'false';
        return {
          isSuccessful: false,
          duration: Date.now() - start,
        };
      }
    });
  });
}
