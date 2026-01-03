'use client';

import React, { memo, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import type { Editor as TinyMCEEditor } from 'tinymce';

export type EditorProps = {
  initialContent?: string;
  onEditorChange?: (newValue: string, editor: TinyMCEEditor) => void;
};

const defaultValue = `<p>Edit your content.</p>`;
const BasicEditor = ({ initialContent, onEditorChange }: EditorProps) => {
  const editorRef = useRef<TinyMCEEditor>(null);

  return (
    <Editor
      onInit={(_evt, editor) => (editorRef.current = editor)}
      initialValue={initialContent || defaultValue}
      onEditorChange={(newValue, editor) => onEditorChange?.(newValue, editor)}
      licenseKey="gpl"
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      init={{
        height: 200,
        menubar: false,
        statusbar: false,
        branding: false,
        plugins: ['advlist', 'autolink', 'lists', 'link', 'charmap', 'anchor', 'code'],
        toolbar: 'fontsize | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist | link',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
      }}
    />
  );
};

const areEqual = (_prevProps: EditorProps, _nextProps: EditorProps) => true; /* does not re-render */
export default memo(BasicEditor, areEqual);
