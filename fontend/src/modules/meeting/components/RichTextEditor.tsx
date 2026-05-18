import React, { useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Register fonts
const Font = Quill.import('formats/font') as any;
Font.whitelist = ['be-vietnam', 'arial', 'times', 'courier', 'georgia'];
Quill.register(Font, true);

// Register sizes
const Size = Quill.import('formats/size') as any;
Size.whitelist = ['10pt', '12pt', '13pt', '14pt', '16pt', '18pt', '20pt', '24pt'];
Quill.register(Size, true);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export interface RichTextEditorRef {
  insertText: (text: string) => void;
}

const formats = [
  'font',
  'size',
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list',
  'bullet',
  'align',
  'indent',
  'blockquote',
  'code-block',
  'link',
  'image',
];

const RichTextEditor = React.forwardRef((
  {
    value,
    onChange,
    placeholder = 'Nhập nội dung chương trình họp...',
    minHeight = '350px',
  }: RichTextEditorProps,
  ref: React.ForwardedRef<RichTextEditorRef>
) => {
  const quillRef = useRef<ReactQuill>(null);
  const lastRangeRef = useRef<{ index: number; length: number } | null>(null);

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        quill.focus();
        const range = lastRangeRef.current || quill.getSelection();
        if (range) {
          quill.insertText(range.index, text);
          quill.setSelection(range.index + text.length, 0);
          lastRangeRef.current = { index: range.index + text.length, length: 0 };
        } else {
          const length = quill.getLength();
          quill.insertText(length - 1, text);
          quill.setSelection(length - 1 + text.length, 0);
          lastRangeRef.current = { index: length - 1 + text.length, length: 0 };
        }
      }
    }
  }));

  // Full-featured toolbar configuration
  const modules = useMemo(
    () => ({
      toolbar: [
        // Font and size
        [{ font: Font.whitelist }, { size: Size.whitelist }],

        // Headers
        [{ header: [1, 2, 3, false] }],

        // Text formatting
        ['bold', 'italic', 'underline', 'strike'],

        // Text color and background
        [{ color: [] }, { background: [] }],

        // Lists
        [{ list: 'ordered' }, { list: 'bullet' }],

        // Alignment
        [{ align: [] }],

        // Indent/Outdent
        [{ indent: '-1' }, { indent: '+1' }],

        // Blockquote and code block
        ['blockquote', 'code-block'],

        // Links and images
        ['link'],

        // Clear formatting
        ['clean'],
      ],
      clipboard: {
        matchVisual: false, // Better paste from Word
      },
    }),
    []
  );

  return (
    <div className="rich-text-editor-wrapper">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        onChangeSelection={(range) => {
          if (range) {
            lastRangeRef.current = range;
          }
        }}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style>{`
        /* Container */
        .rich-text-editor-wrapper .quill {
          border: 1px solid #9CA3AF;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .rich-text-editor-wrapper .quill:hover {
          border-color: #6B7280;
        }

        .rich-text-editor-wrapper .quill:focus-within {
          border-color: #C8102E;
          box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.1);
        }

        /* Toolbar */
        .rich-text-editor-wrapper .ql-toolbar {
          border: none;
          border-bottom: 1px solid #E5E7EB;
          background: #F9FAFB;
          padding: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .rich-text-editor-wrapper .ql-formats {
          margin-right: 8px;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        /* Toolbar buttons */
        .rich-text-editor-wrapper .ql-toolbar button {
          width: 32px;
          height: 32px;
          padding: 6px;
          border-radius: 8px;
          transition: background-color 0.15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .rich-text-editor-wrapper .ql-toolbar button:hover {
          background-color: #E5E7EB;
        }

        .rich-text-editor-wrapper .ql-toolbar button.ql-active {
          background-color: #FEE2E2;
        }

        /* Toolbar dropdowns */
        .rich-text-editor-wrapper .ql-toolbar .ql-picker {
          color: #4B5563;
          font-size: 13px;
          height: 32px;
        }

        .rich-text-editor-wrapper .ql-toolbar .ql-picker-label {
          border-radius: 8px;
          padding: 6px 10px;
          transition: background-color 0.15s;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
        }

        .rich-text-editor-wrapper .ql-toolbar .ql-picker-label:hover {
          background-color: #E5E7EB;
        }

        .rich-text-editor-wrapper .ql-toolbar .ql-picker.ql-expanded .ql-picker-label {
          background-color: #FEE2E2;
          color: #C8102E;
          border-color: #FEE2E2;
        }

        .rich-text-editor-wrapper .ql-toolbar .ql-picker-options {
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          background: white;
          padding: 4px;
          max-height: 250px;
          overflow-y: auto;
        }

        .rich-text-editor-wrapper .ql-toolbar .ql-picker-item {
          padding: 8px 12px;
          border-radius: 6px;
          transition: background-color 0.15s;
        }

        .rich-text-editor-wrapper .ql-toolbar .ql-picker-item:hover {
          background-color: #F3F4F6;
        }

        .rich-text-editor-wrapper .ql-toolbar .ql-picker-item.ql-selected {
          background-color: #FEE2E2;
          color: #C8102E;
        }

        /* Icons */
        .rich-text-editor-wrapper .ql-toolbar .ql-stroke {
          stroke: #6B7280;
        }

        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-stroke {
          stroke: #374151;
        }

        .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-stroke {
          stroke: #C8102E;
        }

        .rich-text-editor-wrapper .ql-toolbar .ql-fill {
          fill: #6B7280;
        }

        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-fill {
          fill: #374151;
        }

        .rich-text-editor-wrapper .ql-toolbar button.ql-active .ql-fill {
          fill: #C8102E;
        }

        /* Editor container */
        .rich-text-editor-wrapper .ql-container {
          border: none;
          font-size: 14px;
          font-family: 'Times New Roman', Times, serif;
        }

        .rich-text-editor-wrapper .ql-editor {
          min-height: ${minHeight};
          padding: 16px 20px;
          color: #111827;
          line-height: 1.6;
        }

        /* Placeholder */
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #9CA3AF;
          font-style: normal;
          left: 20px;
        }

        /* Content styling */
        .rich-text-editor-wrapper .ql-editor h1 {
          font-size: 2em;
          font-weight: 700;
          margin-bottom: 0.5em;
          color: #111827;
        }

        .rich-text-editor-wrapper .ql-editor h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin-bottom: 0.5em;
          color: #1F2937;
        }

        .rich-text-editor-wrapper .ql-editor h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin-bottom: 0.5em;
          color: #374151;
        }

        .rich-text-editor-wrapper .ql-editor p {
          margin-bottom: 0.75em;
        }

        .rich-text-editor-wrapper .ql-editor ul,
        .rich-text-editor-wrapper .ql-editor ol {
          padding-left: 1.5em;
          margin-bottom: 0.75em;
        }

        .rich-text-editor-wrapper .ql-editor li {
          margin-bottom: 0.25em;
        }

        .rich-text-editor-wrapper .ql-editor a {
          color: #C8102E;
          text-decoration: underline;
        }

        .rich-text-editor-wrapper .ql-editor a:hover {
          color: #A90F14;
        }

        .rich-text-editor-wrapper .ql-editor strong {
          font-weight: 600;
        }

        .rich-text-editor-wrapper .ql-editor em {
          font-style: italic;
        }

        .rich-text-editor-wrapper .ql-editor u {
          text-decoration: underline;
        }

        .rich-text-editor-wrapper .ql-editor s {
          text-decoration: line-through;
        }

        .rich-text-editor-wrapper .ql-editor blockquote {
          border-left: 4px solid #C8102E;
          padding-left: 16px;
          margin-left: 0;
          margin-bottom: 0.75em;
          color: #6B7280;
          font-style: italic;
        }

        .rich-text-editor-wrapper .ql-editor pre.ql-syntax {
          background-color: #F3F4F6;
          color: #111827;
          padding: 12px 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin-bottom: 0.75em;
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }

        /* Font families */
        .ql-font-be-vietnam {
          font-family: 'Be Vietnam Pro', sans-serif;
        }

        .ql-font-arial {
          font-family: Arial, sans-serif;
        }

        .ql-font-times {
          font-family: 'Times New Roman', serif;
        }

        .ql-font-courier {
          font-family: 'Courier New', monospace;
        }

        .ql-font-georgia {
          font-family: Georgia, serif;
        }

        /* Font sizes */
        .ql-size-10pt { font-size: 10pt; }
        .ql-size-12pt { font-size: 12pt; }
        .ql-size-13pt { font-size: 13pt; }
        .ql-size-14pt { font-size: 14pt; }
        .ql-size-16pt { font-size: 16pt; }
        .ql-size-18pt { font-size: 18pt; }
        .ql-size-20pt { font-size: 20pt; }
        .ql-size-24pt { font-size: 24pt; }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-font .ql-picker-label::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-font .ql-picker-item::before {
          content: 'Times New Roman';
          font-family: 'Times New Roman', Times, serif;
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=arial]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=arial]::before {
          content: 'Arial';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=times]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=times]::before {
          content: 'Times New Roman';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=courier]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=courier]::before {
          content: 'Courier';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=georgia]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=georgia]::before {
          content: 'Georgia';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item::before {
          content: '14pt';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="10pt"]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="10pt"]::before {
          content: '10pt';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="12pt"]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="12pt"]::before {
          content: '12pt';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="13pt"]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="13pt"]::before {
          content: '13pt';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="14pt"]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="14pt"]::before {
          content: '14pt';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="16pt"]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="16pt"]::before {
          content: '16pt';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="18pt"]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="18pt"]::before {
          content: '18pt';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="20pt"]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="20pt"]::before {
          content: '20pt';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="24pt"]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="24pt"]::before {
          content: '24pt';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-label::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-item::before {
          content: 'Văn bản thường';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before {
          content: 'Tiêu đề 1';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before {
          content: 'Tiêu đề 2';
        }

        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before,
        .rich-text-editor-wrapper .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before {
          content: 'Tiêu đề 3';
        }

        /* Scrollbar */
        .rich-text-editor-wrapper .ql-editor::-webkit-scrollbar {
          width: 8px;
        }

        .rich-text-editor-wrapper .ql-editor::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 4px;
        }

        .rich-text-editor-wrapper .ql-editor::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 4px;
        }

        .rich-text-editor-wrapper .ql-editor::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }

        /* Tooltip for toolbar buttons */
        .rich-text-editor-wrapper .ql-toolbar button {
          position: relative;
        }

        .rich-text-editor-wrapper .ql-toolbar button:hover::after {
          content: attr(title);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #374151;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          white-space: nowrap;
          margin-bottom: 4px;
          pointer-events: none;
          z-index: 10;
        }
      `}</style>
    </div>
  );
});

export { RichTextEditor };
