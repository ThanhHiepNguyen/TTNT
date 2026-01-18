import React, { useState } from 'react';

const VoiceChat = ({ onSendMessage, aiResponse }) => {
  const [isListening, setIsListening] = useState(false);

  // 1. Chức năng Mic (Bạn nói -> Chữ)
  const handleListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ Mic. Hãy dùng Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (onSendMessage) onSendMessage(text);
    };

    recognition.start();
  };

  // 2. Chức năng Loa (Nhấn mới đọc câu trả lời của AI)
  const handleSpeak = () => {
    if (!aiResponse) return;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Dừng câu đang đọc cũ
      const utterance = new SpeechSynthesisUtterance(aiResponse);
      utterance.lang = 'vi-VN';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex gap-1 items-center shrink-0">
      {/* NÚT MIC - BẠN NÓI */}
      <button
        type="button"
        onClick={handleListen}
        className={`p-2 rounded-xl transition-all flex items-center justify-center ${
          isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        style={{ width: '38px', height: '38px' }}
        title="Bấm để nói"
      >
        🎤
      </button>

      {/* NÚT LOA - AI NÓI (Chỉ sáng khi có câu trả lời) */}
      <button
        type="button"
        onClick={handleSpeak}
        disabled={!aiResponse}
        className={`p-2 rounded-xl transition-all flex items-center justify-center ${
          !aiResponse ? 'opacity-30 cursor-not-allowed' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
        }`}
        style={{ width: '38px', height: '38px' }}
        title="Nghe AI đọc câu trả lời"
      >
        🔊
      </button>
    </div>
  );
};

export default VoiceChat;
