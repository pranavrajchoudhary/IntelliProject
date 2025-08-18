import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Square, Circle, Type, Eraser, Download, Trash2 } from 'lucide-react';
import { fabric } from 'fabric';
import { useSocket } from '../../context/SocketContext';

const TOOL_LIST = [
  { id: 'pen', icon: Pencil, label: 'Pen' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

const Whiteboard = ({ projectId }) => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const { socket, joinRoom } = useSocket();
  const [fabricCanvas, setFabricCanvas] = useState(null);

  // Fabric.js canvas setup
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (canvasEl && !fabricCanvas) {
      const canvas = new fabric.Canvas(canvasEl, {
        isDrawingMode: true,
        backgroundColor: '#fff',
        width: 900,
        height: 600,
      });
      setFabricCanvas(canvas);
      return () => { canvas.dispose(); };
    }
  }, [canvasRef, fabricCanvas]);

  // Tool switching
  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.isDrawingMode = (tool === 'pen');
    if (tool !== 'pen') fabricCanvas.isDrawingMode = false;
    // Simple shape logic (add on click)
    fabricCanvas.off('mouse:down');
    if (tool === 'rect' || tool === 'circle' || tool === 'text') {
      fabricCanvas.on('mouse:down', function (opt) {
        const pointer = fabricCanvas.getPointer(opt.e);
        let obj;
        if (tool === 'rect') {
          obj = new fabric.Rect({ left: pointer.x, top: pointer.y, fill: '#111827', width: 80, height: 50 });
        } else if (tool === 'circle') {
          obj = new fabric.Circle({ left: pointer.x, top: pointer.y, fill: '#111827', radius: 40 });
        } else if (tool === 'text') {
          obj = new fabric.Textbox('Text', { left: pointer.x, top: pointer.y, fill: '#111827' });
        }
        if (obj) fabricCanvas.add(obj);
      });
    }
    // Eraser tool
    else if (tool === 'eraser') {
      fabricCanvas.on('mouse:down', function (opt) {
        const target = opt.target;
        if (target) fabricCanvas.remove(target);
      });
    }
  }, [tool, fabricCanvas]);

  // Socket.io integration
  useEffect(() => {
    if (!socket || !fabricCanvas || !projectId) return;
    joinRoom(projectId);

    // Listen for remote events (broadcast logic to be implemented in backend)
    socket.on('drawing', data => {
      // Custom: parse and apply drawing data from other users (not implemented here)
      // fabricCanvas.loadFromJSON(data);
    });

    // On canvas change, broadcast update
    const sendCanvasUpdate = () => {
      const json = fabricCanvas.toJSON();
      socket.emit('drawing', { roomId: projectId, json });
    };

    fabricCanvas.on('object:added', sendCanvasUpdate);
    fabricCanvas.on('object:modified', sendCanvasUpdate);
    fabricCanvas.on('object:removed', sendCanvasUpdate);

    return () => {
      socket.off('drawing');
      fabricCanvas.off('object:added', sendCanvasUpdate);
      fabricCanvas.off('object:modified', sendCanvasUpdate);
      fabricCanvas.off('object:removed', sendCanvasUpdate);
    };
  }, [socket, joinRoom, projectId, fabricCanvas]);

  // Download as image
  const handleDownload = () => {
    if (!fabricCanvas) return;
    const url = fabricCanvas.toDataURL({ format: 'png' });
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whiteboard.png';
    a.click();
  };

  // Clear canvas
  const handleClear = () => {
    if (fabricCanvas) fabricCanvas.clear().setBackgroundColor('#fff', () => {});
  };

  return (
    <div className="w-full flex flex-col items-center bg-white p-6 border-2 border-black rounded-lg">
      <div className="flex gap-4 mb-4">
        {TOOL_LIST.map(t => (
          <motion.button
            key={t.id}
            whileHover={{ scale: 1.1 }}
            className={`px-3 py-2 border-2 rounded-lg flex items-center ${tool === t.id ? 'bg-black text-white' : 'bg-white text-black'}`}
            onClick={() => setTool(t.id)}
          >
            <t.icon className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline font-medium">{t.label}</span>
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={handleDownload}
          className="p-2 border-2 rounded-lg bg-white text-black"
        >
          <Download className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={handleClear}
          className="p-2 border-2 rounded-lg bg-white text-black"
        >
          <Trash2 className="w-5 h-5" />
        </motion.button>
      </div>
      <div className="w-full flex justify-center">
        <canvas ref={canvasRef} className="border-2 border-black rounded bg-white" />
      </div>
    </div>
  );
};

export default Whiteboard;
