import { memo } from 'react';
import useApp from './hooks/useApp';
import './App.css';

function App() {
  const { onDown, onMove, drawEnd, resultCanvasRef, maskingCanvasRef, handleClickDownload } = useApp();
  return (
    <>
      <div className="canvas-wrap">
        {/* 結合用canvas */}
        <canvas id="result-canvas" ref={resultCanvasRef} className="canvas"></canvas>
        {/* マスキング用canvas */}
        <canvas
          id="masking-canvas"
          ref={maskingCanvasRef}
          className="canvas"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={drawEnd}
        ></canvas>
      </div>
      <button onClick={handleClickDownload}>ダウンロード</button>
    </>
  );
}

export default memo(App);