# Set up backend for windows:

download cuda 11.8: https://developer.nvidia.com/cuda-11-8-0-download-archive

download visual studio build tools 2022: https://visualstudio.microsoft.com/visual-cpp-build-tools/

conda create --name openmmlab python=3.8 -y
conda activate openmmlab
pip install torch==2.1.0+cu118 torchvision==0.16.0+cu118 torchaudio==2.1.0+cu118 --index-url https://download.pytorch.org/whl/cu118
pip install ninja

pip install -U openmim
mim install mmengine
mim install "mmcv<2.2.0,>=2.0.0"
mim install "mmdet<3.3.0,>=3.0.0"

pip install -r requirements.txt
pip install -v -e .
mim download mmpose --config td-hm_hrnet-w48_8xb32-210e_coco-256x192  --dest .

choco install ffmpeg

cd analyzer
pip install -r requirements.txt
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

03/29 22:40:31 - mmengine - INFO - the output video has been saved at C:\Users\quanv\mmpose\mmpose\analyzer\output\temp_alcaraz_test\alcaraz_test.mp4
Re-encoding video from C:\Users\quanv\mmpose\mmpose\analyzer\output\temp_alcaraz_test\alcaraz_test.mp4 to C:\Users\quanv\mmpose\mmpose\analyzer\output\temp_alcaraz_test\temp_output.mp4

Failed to load OpenH264 library: openh264-1.8.0-win64.dll
        Please check environment and/or download library: https://github.com/cisco/openh264/releases

[libopenh264 @ 000001b31af0c980] Incorrect library version loaded
[ERROR:0@37.027] global cap_ffmpeg_impl.hpp:3264 open Could not open codec libopenh264, error: Unspecified error (-22)      
[ERROR:0@37.027] global cap_ffmpeg_impl.hpp:3281 open VIDEOIO/FFMPEG: Failed to initialize VideoWriter
Video re-encoding completed
Saved processed video to: C:\Users\quanv\mmpose\mmpose\analyzer\output\alcaraz_test_pose.mp4

03/29 22:41:56 - mmengine - INFO - the output video has been saved at C:\Users\quanv\mmpose\mmpose\analyzer\output\temp_djokovic_test\djokovic_test.mp4
Re-encoding video from C:\Users\quanv\mmpose\mmpose\analyzer\output\temp_djokovic_test\djokovic_test.mp4 to C:\Users\quanv\mmpose\mmpose\analyzer\output\temp_djokovic_test\temp_output.mp4
[libopenh264 @ 000001b3a38d29c0] Incorrect library version loaded
[ERROR:0@121.178] global cap_ffmpeg_impl.hpp:3264 open Could not open codec libopenh264, error: Unspecified error (-22)     
[ERROR:0@121.179] global cap_ffmpeg_impl.hpp:3281 open VIDEOIO/FFMPEG: Failed to initialize VideoWriter
Video re-encoding completed
Saved processed video to: C:\Users\quanv\mmpose\mmpose\analyzer\output\djokovic_test_pose.mp4