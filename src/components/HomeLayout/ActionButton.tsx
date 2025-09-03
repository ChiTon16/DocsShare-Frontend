import React from 'react';

const ActionButtons = () => {
  return (
    <div className="d-flex gap-3 px-4 mb-4">
      <button className="btn btn-outline-primary rounded-pill">📝 Create a quiz</button>
      <button className="btn btn-outline-primary rounded-pill">❓ Ask a Question</button>
      <button className="btn btn-outline-primary rounded-pill">🗒️ Summarize your notes</button>
    </div>
  );
};

export default ActionButtons;
