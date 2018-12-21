"use strict";
import { window, workspace, commands, ConfigurationChangeEvent, Disposable, ExtensionContext, TextEditorSelectionChangeKind, TextEditorSelectionChangeEvent, WorkspaceConfiguration } from "vscode";

export function activate(context: ExtensionContext) {
	let vTools = new VTools();
	context.subscriptions.push(vTools);
}

class VTools {
	private _config: WorkspaceConfiguration;
	private _disposable: Disposable;
	private _timer: NodeJS.Timer;

	constructor() {
		let subscriptions: Disposable[] = [];
		this._config = workspace.getConfiguration("vtools");
		window.onDidChangeTextEditorSelection(this._onUpdateSelection, this, subscriptions);
		workspace.onDidChangeConfiguration(this._onUpdateConfiguration, this, subscriptions);

		this._disposable = Disposable.from(...subscriptions);
	}

	private _onUpdateConfiguration(e: ConfigurationChangeEvent) {
		if (e.affectsConfiguration("vtools")) {
			this._config = workspace.getConfiguration("vtools");
		}
	}

	private _onUpdateSelection(e: TextEditorSelectionChangeEvent) {
		// if selection was not from a click, or if there are no selections, return
		if (e.kind != TextEditorSelectionChangeKind.Mouse || e.selections.length == 0) return;

		// if selection is not a single-position (ie. not a segment of text), return
		var singlePos = e.selections.find(a => a.isEmpty) != null;
		if (!singlePos) return;

		// debounce using delay
		if (this._timer) {
			clearTimeout(this._timer);
		}
		this._timer = setTimeout(() => this._update(), this._config.autoHideDelay)
	}

	private _update() {
		this._timer = undefined;
		let scheme = window.activeTextEditor.document.uri.scheme;
		let schemeIsFile = scheme == "file" || scheme == "untitled";
		// if the current editor is not a file, return;
		if (!schemeIsFile) return;

		if (this._config.autoHideSideBar) {
			commands.executeCommand("workbench.action.focusSideBar");
			commands.executeCommand("workbench.action.toggleSidebarVisibility");
		}

		if (this._config.autoHideBottomBar) {
			commands.executeCommand("workbench.action.focusPanel");
			commands.executeCommand("workbench.action.togglePanel");
		}
	}

	public dispose() {
		this._disposable.dispose();
	}
}