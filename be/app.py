from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import os
from glob import glob
import re
import subprocess
import json
import threading
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

progress_data = {
    "progress": 0,
    "estimated_time_left": 0
}

def update_progress():
    global progress_data
    while True:
        time.sleep(1)
        with app.app_context():
            # Update progress data here based on your specific logic
            pass

progress_thread = threading.Thread(target=update_progress)
progress_thread.daemon = True
progress_thread.start()

def combine_files(file_paths, include_audio, output_file):
    if not file_paths:
        raise ValueError("No files to process.")

    # Create a temporary text file listing all the input files
    with open('file_list.txt', 'w') as f:
        for file_path in file_paths:
            f.write(f"file '{file_path}'\n")

    # Construct the ffmpeg command
    command = ['ffmpeg', '-f', 'concat', '-safe', '0', '-i', 'file_list.txt', '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast']
    
    if include_audio:
        command += ['-c:a', 'aac', '-b:a', '192k']
    else:
        command += ['-an']
    
    command.append(output_file)

    try:
        # Run the ffmpeg command and capture the output in real-time
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        total_duration = 0
        for file_path in file_paths:
            result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            total_duration += float(result.stdout.strip())
        
        processed_duration = 0
        for line in process.stderr:
            if "time=" in line:
                time_str = re.search(r"time=(\d{2}:\d{2}:\d{2}\.\d{2})", line).group(1)
                h, m, s = map(float, time_str.split(':'))
                processed_duration = h * 3600 + m * 60 + s
            
            progress_data['progress'] = (processed_duration / total_duration) * 100
            progress_data['estimated_time_left'] = total_duration - processed_duration
            print(line.strip())
        
        rc = process.poll()
        if rc != 0:
            raise subprocess.CalledProcessError(rc, command)

    except subprocess.CalledProcessError as e:
        error_message = e.stderr.decode('utf-8')
        print(error_message)
        raise ValueError(error_message)
    finally:
        # Clean up the temporary file list
        if os.path.exists('file_list.txt'):
            os.remove('file_list.txt')

    return output_file

def sort_files(file_paths):
    def sort_key(file_path):
        filename = os.path.basename(file_path)
        match = re.match(r"GRMN(\d{4})\.MP4", filename)
        if match:
            return (0, int(match.group(1)))  # Prioritize "GRMN" files by index
        else:
            return (1, os.path.getctime(file_path))  # Other files by creation date

    return sorted(file_paths, key=sort_key)

@app.route('/combine', methods=['POST'])
def combine():
    data = request.json
    file_names = data.get('file_names', [])
    include_audio = data.get('include_audio', False)
    description = data.get('description', '').strip()
    
    if not description:
        return jsonify({"error": "Description is required"}), 400

    # Directory where the files are located
    folder_path = '/videos/processing'
    
    if not os.path.exists(folder_path):
        error_message = f"Folder does not exist: {folder_path}"
        print(error_message)
        return jsonify({"error": error_message}), 400

    file_paths = [os.path.join(folder_path, file_name) for file_name in file_names]
    
    for file_path in file_paths:
        if not os.path.exists(file_path):
            error_message = f"File does not exist: {file_path}"
            print(error_message)
            return jsonify({"error": error_message}), 400

    # Sort files based on naming convention or creation date
    sorted_file_paths = sort_files(file_paths)
    
    output_file = os.path.join(folder_path, f"{description}.mp4")
    
    try:
        result_file = combine_files(sorted_file_paths, include_audio, output_file)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        error_message = f"Unhandled exception: {str(e)}"
        print(error_message)
        return jsonify({"error": error_message}), 500
    
    return jsonify({"result": result_file})

@app.route('/overlay', methods=['POST'])
def overlay():
    data = request.json
    main_video_filename = data.get('main_video_filename')
    overlay_video_filename = data.get('overlay_video_filename')
    position = data.get('position')
    size = int(data.get('size'))
    mute_overlay_audio = data.get('mute_overlay_audio', False)
    scale_overlay_time = data.get('scale_overlay_time', False)

    folder_path = '/videos/processing'

    main_video_path = os.path.join(folder_path, main_video_filename)
    overlay_video_path = os.path.join(folder_path, overlay_video_filename)
    output_file = os.path.join(folder_path, 'overlay_output.mp4')

    if not os.path.exists(main_video_path):
        return jsonify({"error": f"Main video file does not exist: {main_video_path}"}), 400
    if not os.path.exists(overlay_video_path):
        return jsonify({"error": f"Overlay video file does not exist: {overlay_video_path}"}), 400

    # Get video dimensions for scaling the overlay
    main_video_info = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', main_video_path])
    main_width, main_height = map(int, main_video_info.decode().strip().split('x'))

    overlay_width = int(main_width * (size / 100))
    overlay_height = int(main_height * (size / 100))

    # Determine the overlay position
    position_map = {
        'top-left': '10:10',
        'top-center': f'(main_w-overlay_w)/2:10',
        'top-right': f'main_w-overlay_w-10:10',
        'left': '10:(main_h-overlay_h)/2',
        'center': '(main_w-overlay_w)/2:(main_h-overlay_h)/2',
        'right': f'main_w-overlay_w-10:(main_h-overlay_h)/2',
        'bottom-left': f'10:main_h-overlay_h-10',
        'bottom-center': f'(main_w-overlay_w)/2:main_h-overlay_h-10',
        'bottom-right': f'main_w-overlay_w-10:main_h-overlay_h-10',
    }
    overlay_position = position_map[position]

    # Get the duration of the main video and overlay video
    result_main = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', main_video_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    result_overlay = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', overlay_video_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    main_video_duration = float(result_main.stdout.strip())
    overlay_video_duration = float(result_overlay.stdout.strip())

    # Determine the duration to use for the ffmpeg command
    duration_to_use = main_video_duration if scale_overlay_time else min(main_video_duration, overlay_video_duration)

    # Construct the ffmpeg command
    command = ['ffmpeg', '-i', main_video_path, '-i', overlay_video_path, '-filter_complex', f'[1:v]scale={overlay_width}:{overlay_height}[ovrl];[0:v][ovrl]overlay={overlay_position}', '-codec:a', 'copy' if not mute_overlay_audio else '-an']

    if scale_overlay_time:
        command += ['-t', str(duration_to_use)]

    command.append(output_file)

    try:
        # Run the ffmpeg command and capture the output in real-time
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        total_duration = main_video_duration
        processed_duration = 0
        for line in process.stderr:
            if "time=" in line:
                time_str = re.search(r"time=(\d{2}:\d{2}:\d{2}\.\d{2})", line).group(1)
                h, m, s = map(float, time_str.split(':'))
                processed_duration = h * 3600 + m * 60 + s
            
            progress_data['progress'] = (processed_duration / total_duration) * 100
            progress_data['estimated_time_left'] = total_duration - processed_duration
            print(line.strip())
        
        rc = process.poll()
        if rc != 0:
            raise subprocess.CalledProcessError(rc, command)

    except subprocess.CalledProcessError as e:
        error_message = e.stderr.read()
        print(error_message)
        raise ValueError(error_message)

    return jsonify({"result": output_file})

@app.route('/evaluate', methods=['POST'])
def evaluate():
    file = request.files['file']
    file_path = os.path.join('/videos/processing', file.filename)
    file.save(file_path)
    
    command = ['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-print_format', 'json', file_path]
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    if result.returncode != 0:
        return jsonify({"error": result.stderr}), 500

    return jsonify({"info": result.stdout})

@app.route('/progress')
def progress():
    def generate():
        while True:
            time.sleep(1)
            yield f"data: {json.dumps(progress_data)}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

@app.route('/download/<filename>', methods=['GET'])
def download(filename):
    return send_file(f'/videos/processing/{filename}', as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
