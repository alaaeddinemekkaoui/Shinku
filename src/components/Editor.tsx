import React, { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { oneDark } from "@codemirror/theme-one-dark";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onCursorChange: (line: number, column: number) => void;
}

const Editor: React.FC<EditorProps> = ({ content, onChange, onCursorChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        javascript(),
        python(),
        rust(),
        oneDark,
        EditorView.theme({
          "&": { height: "100%" },
          ".cm-scroller": { overflow: "auto" }
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            onChange(newContent);
          }
          
          // Update cursor position
          const cursor = update.state.selection.main.head;
          const line = update.state.doc.lineAt(cursor);
          const lineNumber = line.number;
          const column = cursor - line.from + 1;
          onCursorChange(lineNumber, column);
        }),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Update content when it changes externally (e.g., file open)
  useEffect(() => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString();
      if (currentContent !== content) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: content,
          },
        });
      }
    }
  }, [content]);

  return (
    <div 
      ref={editorRef} 
      style={{ 
        height: "100%", 
        width: "100%", 
        overflow: "hidden",
        position: "relative"
      }} 
    />
  );
};

export default Editor;
