import React from 'react';
import './ThinkingLoader.css';

const ThinkingLoader = () => {
  return (
    <div className="thinking-container glass-panel animate-fade-in">
      <div className="brain-loader-wrapper">
        <div className="brain-loader"></div>
      </div>
      <div className="thinking-content">
        <h4>Agents at work...</h4>
        <p className="thinking-text">Analyzing request and formulating the best approach.</p>
        
        <div className="progress-steps">
          <div className="step active">
            <div className="step-dot"></div>
            <span>Routing</span>
          </div>
          <div className="step-line"></div>
          <div className="step pulsing">
            <div className="step-dot"></div>
            <span>Agents Thinking</span>
          </div>
          <div className="step-line"></div>
          <div className="step pending">
            <div className="step-dot"></div>
            <span>Synthesizing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingLoader;
