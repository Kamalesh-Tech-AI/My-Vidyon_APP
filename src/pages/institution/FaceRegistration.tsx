import { InstitutionLayout } from '@/layouts/InstitutionLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Trash2, CheckCircle2, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import * as tf from '@tensorflow/tfjs';
import * as faceapi from '@vladmandic/face-api';

export function FaceRegistration() {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const loadModels = async () => {
        setLoading(true);
        try {
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models')
            ]);
            setModelsLoaded(true);
            toast.success('Face models loaded successfully');
        } catch (error) {
            console.error('Failed to load models:', error);
            toast.error('Failed to load face detection models. Please check if models exist in /public/models');
        } finally {
            setLoading(false);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            toast.error('Could not access webcam');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setImage(dataUrl);
                // Stop stream
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    const handleUpload = async () => {
        if (!image || !userId) {
            toast.error('Please capture/upload an image and enter a User ID');
            return;
        }

        setLoading(true);
        try {
            // Convert data URL to image element for face-api
            const img = await faceapi.fetchImage(image);
            const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

            if (!detections) {
                toast.error('No face detected in the image. Please try again.');
                return;
            }

            const embedding = Array.from(detections.descriptor);

            const { error } = await supabase
                .from('face_embeddings')
                .insert({
                    user_id: userId,
                    embedding: embedding,
                    label: `User ${userId}`
                });

            if (error) throw error;

            toast.success('Face registered successfully!');
            setImage(null);
            setUserId('');
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Failed to register face');
        } finally {
            setLoading(false);
        }
    };

    return (
        <InstitutionLayout>
            <PageHeader
                title="Face Registration"
                subtitle="Register staff and student faces for V380 camera attendance"
            />

            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="dashboard-card p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-institution" />
                        User Details
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">User ID (Supabase Auth ID)</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full p-2 border rounded-md"
                                placeholder="Paste user UUID here"
                            />
                        </div>
                        {!modelsLoaded && (
                            <Button onClick={loadModels} className="w-full bg-institution hover:bg-institution/90">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Load Models (Required)
                            </Button>
                        )}
                    </div>
                </div>

                <div className="dashboard-card p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-institution" />
                        Face Capture
                    </h3>

                    {!image ? (
                        <div className="space-y-4">
                            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={startCamera} variant="outline" className="w-full">
                                    Start Camera
                                </Button>
                                <Button onClick={capturePhoto} className="w-full bg-institution hover:bg-institution/90">
                                    Capture
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <img src={image} alt="Captured face" className="w-full aspect-video object-cover rounded-lg" />
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => setImage(null)} variant="outline" className="w-full text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Retake
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={loading || !userId}
                                    className="w-full bg-success hover:bg-success/90"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    Register Face
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </InstitutionLayout>
    );
}
