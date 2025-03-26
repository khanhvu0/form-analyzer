set up for windows:

download cuda 11.8: https://developer.nvidia.com/cuda-11-8-0-download-archive

conda create --name openmmlab python=3.8 -y
conda activate openmmlab
conda install pytorch torchvision torchaudio pytorch-cuda -c pytorch -c nvidia

pip install -U openmim
mim install mmengine
mim install "mmcv==2.0.1"
mim install "mmdet>=3.1.0"

pip install -r requirements.txt
pip install -v -e .
mim download mmpose --config td-hm_hrnet-w48_8xb32-210e_coco-256x192  --dest .

download ffmpeg: choco install ffmpeg

python main.py

# Frontend Setup

The frontend is built with React, TypeScript, and Material UI. Follow these steps to get it running:

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:5173 (or another port if 5173 is in use). The development server includes:
- Hot Module Replacement (HMR) for instant updates
- TypeScript compilation
- Material UI components and theming
- Modern responsive design

Note: Make sure you have Node.js (v16 or later) installed on your system before running the frontend.