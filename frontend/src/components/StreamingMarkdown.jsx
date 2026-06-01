import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const StreamingMarkdown = ({ content, onComplete, scrollRef }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Blinking cursor effect
  useEffect(() => {
    if (isFinished) return;
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 10); // 400ms blink rate
    return () => clearInterval(cursorInterval);
  }, [isFinished]);

  // Streaming effect
  useEffect(() => {
    let currentIndex = 0;
    // Slower reading speed: 2 chars per 25ms
    const charsPerTick = 2;
    const intervalTime = 25;

    const timer = setInterval(() => {
      currentIndex += charsPerTick;
      if (currentIndex >= content.length) {
        setDisplayedContent(content);
        setIsFinished(true);
        clearInterval(timer);
        if (onComplete) onComplete();
      } else {
        setDisplayedContent(content.substring(0, currentIndex));
      }
      
      // Smart Auto-scroll: Only scroll if the user is near the bottom
      if (scrollRef && scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (isNearBottom) {
          scrollRef.current.scrollTop = scrollHeight;
        }
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [content, onComplete, scrollRef]);

  // Allow user to click to skip the animation and instantly read the full output
  const handleSkipAnimation = () => {
    if (!isFinished) {
      setDisplayedContent(content);
      setIsFinished(true);
      if (onComplete) onComplete();
    }
  };

  return (
    <div 
      className={`streaming-markdown ${!isFinished ? 'is-streaming' : ''}`}
      onClick={handleSkipAnimation}
      title={!isFinished ? "Click to skip animation" : ""}
      style={!isFinished ? { cursor: 'pointer' } : {}}
    >
      <ReactMarkdown>
        {displayedContent + (isFinished ? '' : (showCursor ? ' ▋' : ''))}
      </ReactMarkdown>
    </div>
  );
};

export default StreamingMarkdown;
