import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import GlassCard from './GlassCard';

// NOTE
// react-quill is a browser-only library (it references `document`) and must not be
// imported at module scope in server-side rendered environments. We dynamically
// load it on the client and show a lightweight textarea fallback until it's ready.

export default function RichTextEditor({ value = '', onChange, placeholder = 'Start writing...' }) {
  const [content, setContent] = useState(value);
  const [preview, setPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [QuillComponent, setQuillComponent] = useState(null);
  const quillRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    // Dynamically import react-quill and its styles on the client only
    import('react-quill')
      .then((mod) => {
        if (!mounted) return;
        setQuillComponent(() => mod.default || mod);
      })
      .then(() => {
        // import the CSS after the module so bundlers include it only for client
        try {
          return import('react-quill/dist/quill.snow.css');
        } catch {
          // ignore; CSS import can fail in some build configs
          return null;
        }
      })
      .catch(() => {
        // Swallow errors so SSR/build doesn't fail; the component will fall back to textarea
        // You can console.error here for local debugging if desired.
        // console.error('Failed to load react-quill dynamically', err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const updateContent = (newContent) => {
    setContent(newContent);
    if (onChange) onChange(newContent);
  };

  const modules = {
    toolbar: [
      [{ header: [2, 3, false] }], // H2, H3 only (H1 is title)
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link', 'image'],
      ['clean']
      // Removed table - not supported by react-quill without additional modules
    ],
    clipboard: {
      matchVisual: false
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'color', 'background',
    'align',
    'link', 'image'
    // Removed 'table' format
  ];

  return (
    <div className="space-y-4">
      <style>{`
        .ql-toolbar {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem 0.5rem 0 0;
          padding: 12px;
        }
        .ql-container {
          border: 1px solid #e5e7eb;
          border-radius: 0 0 0.5rem 0.5rem;
          min-height: 400px;
          font-size: 16px;
          font-family: inherit;
        }
        .ql-editor {
          min-height: 400px;
          padding: 20px;
        }
        .ql-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: #1f2937;
        }
        .ql-editor h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: #374151;
        }
        .ql-editor p {
          margin-bottom: 1em;
          line-height: 1.6;
        }
        .ql-editor ul, .n-editor ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }
        .ql-editor li {
          margin-bottom: 0.5em;
        }
        .ql-editor blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #4b5563;
        }
        .ql-editor code {
          background: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }
        .ql-editor pre {
          background: #1f2937;
          color: #f3f4f6;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
        }
        .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1em 0;
        }
        .ql-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .ql-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        .ql-editor table td,
        .ql-editor table th {
          border: 1px solid #e5e7eb;
          padding: 0.5em;
        }
        .ql-editor table th {
          background: #f9fafb;
          font-weight: bold;
        }
        .ql-toolbar .ql-stroke {
          stroke: #374151;
        }
        .ql-toolbar .ql-fill {
          fill: #374151;
        }
        .ql-toolbar .ql-picker-label {
          color: #374151;
        }
        .ql-toolbar button:hover,
        .ql-toolbar button:focus {
          background: #e5e7eb;
        }
        .ql-toolbar button.ql-active {
          background: #dbeafe;
        }
        .ql-snow .ql-picker.ql-expanded .ql-picker-label {
          border-color: #3b82f6;
        }
      `}</style>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant={preview ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPreview(!preview)}
        >
          {preview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {preview ? 'Edit' : 'Preview'}
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowHelp(!showHelp)}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Formatting Guide
        </Button>
      </div>

      {showHelp && (
        <GlassCard className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-bold text-gray-900 mb-3">Formatting Guide</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-semibold text-gray-900 mb-2">Structure</h5>
              <ul className="space-y-1 text-gray-700">
                <li>• <strong>H2</strong> for main sections</li>
                <li>• <strong>H3</strong> for subsections</li>
                <li>• Keep paragraphs short (2-3 sentences)</li>
                <li>• Use bullet points for lists</li>
                <li>• Use numbered lists for steps</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-2">Emphasis</h5>
              <ul className="space-y-1 text-gray-700">
                <li>• <strong>Bold</strong> for key terms</li>
                <li>• <em>Italic</em> for emphasis</li>
                <li>• Blockquotes for warnings/notes</li>
                <li>• Links for references</li>
                <li>• Code blocks for forms/numbers</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-300">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> For tables, write them in HTML manually using &lt;table&gt; tags in code view. 
              ReactQuill does not have built-in table support.
            </p>
          </div>
        </GlassCard>
      )}

      {preview ? (
        <GlassCard className="p-8 min-h-[400px]">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </GlassCard>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          {QuillComponent ? (
            <QuillComponent
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={updateContent}
              modules={modules}
              formats={formats}
              placeholder={placeholder}
            />
          ) : (
            // Lightweight SSR-safe fallback until the full editor loads
            <div className="p-4">
              <textarea
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder={placeholder}
                className="w-full min-h-[300px] p-3 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-2">Editor is loading... full editor will replace this shortly on the client.</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <strong>Pro Tip:</strong> Use the formatting toolbar above just like Microsoft Word or Google Docs. 
          Select text and click buttons to format. No HTML knowledge needed!
        </p>
      </div>
    </div>
  );
}