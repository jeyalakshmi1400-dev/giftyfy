import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function TipTapEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="tiptap-container">

      {/* Toolbar */}
      <div className="tiptap-toolbar">

        <button onClick={() => editor.chain().focus().toggleBold().run()}>
          B
        </button>

        <button onClick={() => editor.chain().focus().toggleItalic().run()}>
          I
        </button>

        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>

        <button onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </button>

        <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </button>

        <button onClick={() => editor.chain().focus().undo().run()}>
          Undo
        </button>

        <button onClick={() => editor.chain().focus().redo().run()}>
          Redo
        </button>

      </div>

      {/* Editor Box */}
      <EditorContent editor={editor} />
    </div>
  );
}