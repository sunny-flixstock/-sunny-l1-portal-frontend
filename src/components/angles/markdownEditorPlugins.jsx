import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  DiffSourceToggleWrapper,
  ListsToggle,
  MDXEditor,
  UndoRedo,
  codeMirrorPlugin,
  diffSourcePlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from '@mdxeditor/editor'

export const markdownEditorPlugins = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  markdownShortcutPlugin(),
  // Without a registered code-block plugin, any fenced ``` block (any
  // language tag, including untagged) has no matching mdast->Lexical
  // visitor -- MDXEditor throws UnrecognizedMarkdownConstructError mid-import
  // and silently drops every block after the fence. codeMirrorPlugin's
  // built-in descriptor matches on `!meta || Object.hasOwn(keyMap, language)`,
  // so an empty language map is enough to make any fence with no meta string
  // (ours included) survive import as a plain editable code block.
  codeMirrorPlugin({ codeBlockLanguages: {} }),
  // Surfaces markdownProcessingError$ (set when import still throws for some
  // other unsupported construct) as a visible banner instead of the silent
  // truncation this was previously failing with, and gives a Source-mode
  // escape hatch to see/fix the raw markdown when it happens.
  diffSourcePlugin(),
  toolbarPlugin({
    toolbarContents: () => (
      <DiffSourceToggleWrapper options={['rich-text', 'source']}>
        <UndoRedo />
        <BlockTypeSelect />
        <BoldItalicUnderlineToggles />
        <ListsToggle />
        <CreateLink />
      </DiffSourceToggleWrapper>
    ),
  }),
]

export { MDXEditor }
