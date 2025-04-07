cd # Tennis Serve Analysis

A web application for analyzing tennis serves using computer vision and pose estimation. The application processes front and side view videos of tennis serves to detect key moments and ball positions.

## Features

- Upload and process front and side view videos of tennis serves
- Detect key moments in the serve motion (e.g., ball release, trophy position, impact)
- Track tennis ball position throughout the serve
- Visualize key moments and ball positions on a timeline
- Interactive video playback with moment markers

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- CUDA-capable GPU (recommended for faster processing)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/tennis-serve-analysis.git
cd tennis-serve-analysis
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Install frontend dependencies:

```bash
cd analyzer/frontend
npm install
```

4. Build the frontend:

```bash
npm run build
```

## Usage

1. Start the Flask backend:

```bash
cd analyzer
python main.py
```

2. Open your web browser and navigate to `http://localhost:5000`

3. Upload your front and side view videos of a tennis serve

4. Wait for the processing to complete

5. Use the video player controls to navigate through the serve and view key moments

## Project Structure

```
form-analyzer/
├── analyzer/
│   ├── frontend/           # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── VideoUpload.tsx
│   │   │   │   └── VideoPlayer.tsx
│   │   │   └── App.tsx
│   │   └── package.json
│   ├── main.py            # Flask backend
│   ├── video_processor.py # Video processing logic
│   └── key_moment_detector.py # Key moment detection
├── uploads/               # Temporary storage for uploaded videos
└── requirements.txt       # Python dependencies
```

## API Endpoints

- `POST /api/upload`: Upload front and side view videos
- `GET /api/video/<filename>`: Get processed video file
- `GET /api/moments/<video_name>`: Get key moments for a video
- `GET /api/balls/<video_name>`: Get ball detections for a video

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
