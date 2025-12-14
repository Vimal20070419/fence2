import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceCam = ({ onFaceDetected, mode = 'verify', existingDescriptor = null }) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Loading models...');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    const MODEL_URL = '/models';
    try {
      setStatus('Loading SSD Mobilenet...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      
      setStatus('Loading Face Landmark 68...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      
      setStatus('Loading Face Recognition...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

      setStatus('Models loaded. Starting camera...');
      startVideo();
    } catch (err) {
      console.error('Error loading face-api models:', err);
      // DEBUG: Show what is actually available in faceapi.nets
      const nets = faceapi.nets ? Object.keys(faceapi.nets).join(', ') : 'nets is undefined';
      setError(`Failed to load models. Error: ${err.message}. Available nets: ${nets}`);
      setLoading(false);
    }
  };

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Camera access denied');
        setLoading(false);
      });
  };

  const handleVideoPlay = () => {
    setLoading(false);
    setStatus('Detecting face...');
    
    // Create canvas from video for drawing
    const video = videoRef.current;
    
    const interval = setInterval(async () => {
      if (!video || video.paused || video.ended) return;

      if (!videoRef.current) return; 

      try {
          const detection = await faceapi
            .detectSingleFace(video)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            setStatus('Face detected!');
            
            if (mode === 'enroll') {
               // For enrollment, just return the descriptor
               clearInterval(interval);
               onFaceDetected(detection.descriptor);
            } else if (mode === 'verify' && existingDescriptor) {
               // Verify against existing
               const distance = faceapi.euclideanDistance(detection.descriptor, existingDescriptor);
               // Threshold typically 0.6
               if (distance < 0.6) {
                 clearInterval(interval);
                 onFaceDetected(true);
               } else {
                 setStatus('Face not match. Try again.');
               }
            }
          } else {
             setStatus('No face detected...');
          }
      } catch (err) {
          console.error("Detection error", err);
      }
    }, 1000); // Check every second to save resources likely

    return () => clearInterval(interval);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
      <div className="relative overflow-hidden rounded-lg shadow-lg bg-black" style={{ width: '320px', height: '240px' }}>
         <video 
           ref={videoRef} 
           autoPlay 
           muted 
           onPlay={handleVideoPlay}
           width="320"
           height="240"
           className="object-cover"
         />
         <canvas ref={canvasRef} className="absolute top-0 left-0" />
         
         {loading && (
           <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
             {status}
           </div>
         )}
      </div>
      
      <div className="mt-4 text-center">
        {error ? (
          <p className="text-red-600 font-medium">{error}</p>
        ) : (
          <p className="text-gray-700 font-medium">{status}</p>
        )}
      </div>
    </div>
  );
};

export default FaceCam;
