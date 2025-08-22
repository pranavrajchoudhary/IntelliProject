import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, Play, Pause, Send, X } from 'lucide-react';

const VoiceRecorder = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
  return () => {
    // Cleanup on unmount
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };
}, []);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to record voice messages');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const playAudio = async () => {
  if (audioBlob && audioRef.current) {
    try {
      console.log('Play button clicked, attempting to play audio');
      
      // Check if audio is already playing
      if (!audioRef.current.paused) {
        console.log('Audio is already playing');
        return;
      }
      
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('Audio started playing successfully');
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Play failed:', error.name, error.message);
      setIsPlaying(false);
    }
  } else {
    console.log('No audio blob or ref available');
  }
};


 const pauseAudio = () => {
  if (audioRef.current) {
    console.log('Pause button clicked');
    audioRef.current.pause();
    setIsPlaying(false);
  }
};



  const sendVoiceMessage = () => {
    if (audioBlob) {
      onSendVoice(audioBlob, duration);
      resetRecorder();
    }
  };

  const resetRecorder = () => {
  // Stop audio if playing
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }
  
  setAudioBlob(null);
  setDuration(0);
  setIsPlaying(false);
  clearInterval(timerRef.current);
};


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg shadow-lg border"
    >
      {audioBlob && (
        <audio
          ref={audioRef}
          key={`audio-${audioBlob.size}-${Date.now()}`}
          controls // Keep for debugging
          preload="metadata"
          onLoadedData={() => console.log('Audio loaded and ready')}
          onPlay={() => {
            console.log('Audio onPlay event fired');
            setIsPlaying(true);
          }}
          onPause={() => {
            console.log('Audio onPause event fired');
            setIsPlaying(false);
          }}
          onEnded={() => {
            console.log('Audio onEnded event fired');
            setIsPlaying(false);
          }}
          onError={(e) => console.error('Audio element error:', e)}
        >
          <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
        </audio>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {!audioBlob ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-full ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          ) : (
            // <button
            //   onClick={isPlaying ? pauseAudio : playAudio}
            //   className="p-3 rounded-full bg-green-500 text-white hover:bg-green-600"
            // >
            //   {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            // </button>
            <p>Preview</p>
          )}

          <div className="text-sm text-gray-600">
            {formatTime(duration)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
          
          {audioBlob && (
            <button
              onClick={sendVoiceMessage}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isRecording && (
        <div className="mt-2 text-sm text-gray-500 text-center">
          Recording... Tap stop when done
        </div>
      )}
    </motion.div>
  );
};

export default VoiceRecorder;
