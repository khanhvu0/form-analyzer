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