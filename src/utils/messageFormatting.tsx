import React from 'react';

export const formatMessage = (content: string): React.ReactElement => {
  // Split content into paragraphs
  const paragraphs = content.split('\n\n');
  
  return (
    <div>
      {paragraphs.map((paragraph, index) => {
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
          
          // Use a switch statement to handle different heading levels
          switch (level) {
            case 1:
              return <h1 key={index} className="text-2xl font-bold mb-2">{text}</h1>;
            case 2:
              return <h2 key={index} className="text-xl font-bold mb-2">{text}</h2>;
            case 3:
              return <h3 key={index} className="text-lg font-bold mb-2">{text}</h3>;
            case 4:
              return <h4 key={index} className="text-base font-bold mb-2">{text}</h4>;
            case 5:
              return <h5 key={index} className="text-sm font-bold mb-2">{text}</h5>;
            case 6:
              return <h6 key={index} className="text-xs font-bold mb-2">{text}</h6>;
            default:
              return <p key={index} className="mb-2">{text}</p>;
          }
        }
        
        // Regular paragraph
        return <p key={index} className="mb-2">{paragraph}</p>;
      })}
    </div>
  );
}; 