import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const files = [
    'ssd_mobilenet_v1_model-weights_manifest.json',
    'ssd_mobilenet_v1_model-shard1',
    'ssd_mobilenet_v1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

files.forEach(file => {
    const filePath = path.join(modelsDir, file);
    const fileUrl = `${baseUrl}/${file}`;
    
    console.log(`Downloading ${file}...`);
    
    https.get(fileUrl, (response) => {
        if (response.statusCode === 200) {
            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`Downloaded ${file}`);
            });
        } else {
            console.error(`Failed to download ${file}: Status ${response.statusCode}`);
        }
    }).on('error', (err) => {
        console.error(`Error downloading ${file}: ${err.message}`);
    });
});
