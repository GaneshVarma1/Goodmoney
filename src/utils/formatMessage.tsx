import React from 'react';

/**
 * Formats a message string into React elements with headings, lists, and paragraphs.
 * @param content The message content
 */
export function formatMessage(content: string): React.ReactNode[] {
  const paragraphs = content.split('\n\n');
  return paragraphs.map((paragraph, index) => {
    if (paragraph.trim().startsWith('- ')) {
      return (
        <ul key={index} className="list-disc list-inside space-y-1">
          {paragraph.split('\n').map((item, itemIndex) => (
            <li key={itemIndex} className="ml-4">{item.replace('- ', '')}</li>
          ))}
        </ul>
      );
    }
    if (paragraph.trim().startsWith('#')) {
      const level = paragraph.match(/^#+/)?.[0].length || 1;
      const text = paragraph.replace(/^#+\s*/, '');
      switch (level) {
        case 1:
          return <h1 key={index} className="text-xl font-bold mb-2">{text}</h1>;
        case 2:
          return <h2 key={index} className="text-lg font-semibold mb-2">{text}</h2>;
        case 3:
          return <h3 key={index} className="text-base font-semibold mb-2">{text}</h3>;
        default:
          return <h4 key={index} className="text-sm font-semibold mb-2">{text}</h4>;
      }
    }
    return <p key={index} className="mb-2">{paragraph}</p>;
  });
} 