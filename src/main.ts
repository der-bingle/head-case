import {
	App,
	Editor,
	EditorPosition,
	EditorSelection,
	FuzzySuggestModal,
	getLanguage,
	Plugin,
} from "obsidian";
import { CommandFn, HeadCaseCommand, commands } from "./commands";

const normalizeSelection = ({
	anchor,
	head,
}: EditorSelection): [from: EditorPosition, to: EditorPosition] =>
	anchor.line < head.line
		? [anchor, head]
		: anchor.line > head.line
			? [head, anchor]
			: anchor.ch < head.ch
				? [anchor, head]
				: [head, anchor];

const replaceAllSelections = (editor: Editor, fn: CommandFn): void => {
	if (!editor.somethingSelected()) {
		return;
	}

	const locale = getLanguage();
	editor.transaction({
		changes: editor.listSelections().map((selection) => {
			const [from, to] = normalizeSelection(selection);
			const text = editor.getRange(from, to).normalize();
			return { from, to, text: fn(text, { locale }) };
		}),
	});
};

class HeadCaseModal extends FuzzySuggestModal<HeadCaseCommand> {
	constructor(
		app: App,
		private readonly editor: Editor
	) {
		super(app);
	}

	getItems(): HeadCaseCommand[] {
		return commands;
	}

	getItemText(command: HeadCaseCommand): string {
		return command.name;
	}

	onChooseItem(command: HeadCaseCommand): void {
		replaceAllSelections(this.editor, command.fn);
	}
}

export default class HeadCasePlugin extends Plugin {
	async onload(): Promise<void> {
		this.addCommand({
			id: "select",
			name: "Select case transform",
			icon: "case-sensitive",
			editorCallback: (editor: Editor): void => {
				const modal = new HeadCaseModal(this.app, editor);
				modal.setPlaceholder("Choose a prose transform");
				modal.open();
			},
		});

		for (const { id, name, fn } of commands) {
			this.addCommand({
				id,
				name,
				icon: "case-sensitive",
				editorCallback: (editor: Editor): void => {
					replaceAllSelections(editor, fn);
				},
			});
		}
	}
}
