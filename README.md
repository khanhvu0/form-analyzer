# Tennis Serve Analyzer

An application for analyzing tennis serves using computer vision and pose estimation (OpenCV YOLO and MMPose).

Video demo link: https://youtube.com/shorts/riT4e5XwXgg?feature=share


## Features

- Upload and process videos of tennis serves
- Detect key moments in the serve motion (e.g., ball release, trophy position, impact)
- Track the player's skeleton/pose, tennis ball, and tennis racket position throughout the serve
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

3. Upload your 2 videos of tennis serves to compare and analyze

4. Wait for the processing to complete

5. Use the video player controls to navigate through the serve and view key moments


## License

This project is licensed under the MIT License.
