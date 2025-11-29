import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered,
  Quote,
  Undo,
  Redo
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Simple formatting toolbar button
const ToolbarButton = ({ icon: Icon, isActive, onClick, title }) => {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={title}
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      )}
    >
      <Icon className="w-4 h-4" />
    </motion.button>
  );
};

// Formatting toolbar
const FormattingToolbar = ({ onFormat, activeFormats }) => {
  const tools = [
    { icon: Bold, command: 'bold', title: 'Bold (Ctrl+B)' },
    { icon: Italic, command: 'italic', title: 'Italic (Ctrl+I)' },
    { icon: Heading1, command: 'h1', title: 'Heading 1' },
    { icon: Heading2, command: 'h2', title: 'Heading 2' },
    { icon: List, command: 'ul', title: 'Bullet List' },
    { icon: ListOrdered, command: 'ol', title: 'Numbered List' },
    { icon: Quote, command: 'blockquote', title: 'Quote' },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 backdrop-blur-sm"
    >
      {tools.map((tool, index) => (
        <React.Fragment key={tool.command}>
          <ToolbarButton
            icon={tool.icon}
            isActive={activeFormats.includes(tool.command)}
            onClick={() => onFormat(tool.command)}
            title={tool.title}
          />
          {index === 1 && <div className="w-px h-6 bg-border mx-1" />}
          {index === 3 && <div className="w-px h-6 bg-border mx-1" />}
        </React.Fragment>
      ))}
    </motion.div>
  );
};

export default function RichTextEditor({
  content = '',
  placeholder = 'Start writing...',
  onChange,
  onPlainTextChange,
  autoFocus = false,
  showToolbar = true,
  minHeight = '200px',
}) {
  const editorRef = useRef(null);
  const [activeFormats, setActiveFormats] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!content);
  
  // Initialize content
  useEffect(() => {
    if (editorRef.current && content && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
      setIsEmpty(!content || content === '<br>' || content === '<p><br></p>');
    }
  }, [content]);
  
  // Auto focus
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);
  
  // Check active formats
  const checkActiveFormats = useCallback(() => {
    const formats = [];
    
    if (document.queryCommandState('bold')) formats.push('bold');
    if (document.queryCommandState('italic')) formats.push('italic');
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const parentElement = selection.getRangeAt(0).commonAncestorContainer;
      const element = parentElement.nodeType === 3 ? parentElement.parentElement : parentElement;
      
      if (element?.closest('h1')) formats.push('h1');
      if (element?.closest('h2')) formats.push('h2');
      if (element?.closest('ul')) formats.push('ul');
      if (element?.closest('ol')) formats.push('ol');
      if (element?.closest('blockquote')) formats.push('blockquote');
    }
    
    setActiveFormats(formats);
  }, []);
  
  // Handle input
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    
    const html = editorRef.current.innerHTML;
    const plainText = editorRef.current.innerText || '';
    
    setIsEmpty(!plainText.trim());
    onChange?.(html);
    onPlainTextChange?.(plainText);
    checkActiveFormats();
  }, [onChange, onPlainTextChange, checkActiveFormats]);
  
  // Format text
  const handleFormat = useCallback((command) => {
    editorRef.current?.focus();
    
    switch (command) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'h1':
        document.execCommand('formatBlock', false, '<h1>');
        break;
      case 'h2':
        document.execCommand('formatBlock', false, '<h2>');
        break;
      case 'ul':
        document.execCommand('insertUnorderedList', false);
        break;
      case 'ol':
        document.execCommand('insertOrderedList', false);
        break;
      case 'blockquote':
        document.execCommand('formatBlock', false, '<blockquote>');
        break;
      default:
        break;
    }
    
    handleInput();
  }, [handleInput]);
  
  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleFormat('italic');
          break;
        default:
          break;
      }
    }
  }, [handleFormat]);
  
  // Selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      if (isFocused) {
        checkActiveFormats();
      }
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [isFocused, checkActiveFormats]);
  
  // Paste handler - strip formatting
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);
  
  return (
    <div className="relative">
      {/* Toolbar */}
      {showToolbar && isFocused && (
        <div className="sticky top-0 z-10 pb-3">
          <FormattingToolbar
            onFormat={handleFormat}
            activeFormats={activeFormats}
          />
        </div>
      )}
      
      {/* Editor */}
      <div className="relative">
        {/* Placeholder */}
        {isEmpty && !isFocused && (
          <div className="absolute inset-0 pointer-events-none text-muted-foreground text-lg">
            {placeholder}
          </div>
        )}
        
        {/* Editable content */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPaste={handlePaste}
          className={cn(
            'outline-none text-lg leading-relaxed',
            'prose prose-invert prose-lg max-w-none',
            'prose-headings:font-semibold prose-headings:mb-4 prose-headings:mt-6',
            'prose-h1:text-3xl prose-h2:text-2xl',
            'prose-p:mb-4',
            'prose-ul:mb-4 prose-ol:mb-4',
            'prose-li:mb-1',
            'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground',
            'caret-primary',
            '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground',
            // Smooth caret animation
            'selection:bg-primary/30'
          )}
          style={{ minHeight }}
          data-placeholder={placeholder}
        />
        
        {/* Focus indicator */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </div>
  );
}

// Read-only renderer for viewing entries
export function RichTextRenderer({ content, className }) {
  return (
    <div
      className={cn(
        'prose prose-invert prose-lg max-w-none',
        'prose-headings:font-semibold prose-headings:mb-4 prose-headings:mt-6',
        'prose-h1:text-3xl prose-h2:text-2xl',
        'prose-p:mb-4',
        'prose-ul:mb-4 prose-ol:mb-4',
        'prose-li:mb-1',
        'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground',
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

// Simple title input (iOS Journal style)
export function TitleInput({ value, onChange, placeholder = 'Title' }) {
  const inputRef = useRef(null);
  
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full bg-transparent outline-none',
        'text-2xl font-semibold placeholder:text-muted-foreground',
        'caret-primary'
      )}
    />
  );
}
