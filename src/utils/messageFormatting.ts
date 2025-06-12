import React from 'react';

export const formatMessage = (content: string) => {
  // Split content into paragraphs
  const paragraphs = content.split('\n\n');
  
  return paragraphs.map((paragraph, index) => {
    // Check if paragraph is a list item
    if (paragraph.trim().startsWith('- ')) {
      return (
        <ul key={index} className="list-disc list-inside space-y-1">
          {paragraph.split('\n').map((item, itemIndex) => (
            <li key={itemIndex} className="ml-4">{item.replace('- ', '')}</li>
          ))}
        </ul>
      );
    }
    
    // Check if paragraph is a heading (starts with #)
    if (paragraph.trim().startsWith('#')) {
      const level = paragraph.match(/^#+/)?.[0].length || 1;
      const text = paragraph.replace(/^#+\s*/, '');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const HeadingTag = `h${level}` as any;
      return React.createElement(
        HeadingTag,
        { key: index, className: 'font-semibold mb-2' },
        text
      );
    }
    
    // Regular paragraph
    return <p key={index} className="mb-2">{paragraph}</p>;
  });
}; 