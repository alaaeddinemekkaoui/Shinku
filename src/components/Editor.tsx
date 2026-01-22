import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
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

export interface EditorHandle {
  copy: () => Promise<string | null>;
  cut: () => Promise<string | null>;
  paste: () => Promise<void>;
  focus: () => void;
  selectAll: () => void;
  getSelection: () => { from: number; to: number; text: string };
}
const Editor = forwardRef<EditorHandle, EditorProps>(({ content, onChange, onCursorChange }, ref) => {
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

  useImperativeHandle(ref, () => ({
    focus: () => {
      viewRef.current?.focus();
    },
    copy: async () => {
      const view = viewRef.current;
      if (!view) return null;
      const sel = view.state.selection.main;
      const text = view.state.sliceDoc(sel.from, sel.to);
      if (text) {
        await navigator.clipboard.writeText(text);
      }
      return text || null;
    },
    cut: async () => {
      const view = viewRef.current;
      if (!view) return null;
      const sel = view.state.selection.main;
      const text = view.state.sliceDoc(sel.from, sel.to);
      if (text) {
        await navigator.clipboard.writeText(text);
        view.dispatch({ changes: { from: sel.from, to: sel.to, insert: "" } });
      }
      return text || null;
    },
    paste: async () => {
      const view = viewRef.current;
      if (!view) return;
      const clip = await navigator.clipboard.readText();
      const sel = view.state.selection.main;
      view.dispatch({ changes: { from: sel.from, to: sel.to, insert: clip } });
    },
    selectAll: () => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        selection: { anchor: 0, head: view.state.doc.length }
      });
      view.focus();
    },
    getSelection: () => {
      const view = viewRef.current;
      if (!view) return { from: 0, to: 0, text: '' };
      const sel = view.state.selection.main;
      return {
        from: sel.from,
        to: sel.to,
        text: view.state.sliceDoc(sel.from, sel.to)
      };
    }
  }), []);

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
});

export default Editor;
