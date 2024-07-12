const express = require('express');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// imagen
app.get('/image', (req, res) => {
    const inputPath = path.join(__dirname, 'media', 'input.jpg');
    sharp(inputPath)
        .resize(300, 300)
        .toBuffer()
        .then(data => {
            res.type('image/jpeg');
            res.send(data);
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error processing image');
        });
});

//audio
app.get('/audio', (req, res) => {
    const inputAudioPath = './media/input.mp3';
    const outputWavPath = './media/output.wav';

    ffmpeg(inputAudioPath)
        .toFormat('wav')
        .on('end', () => {
            res.download(outputWavPath, 'output.wav', err => {
                if (err) {
                    console.error('Error sending WAV file:', err);
                    res.status(500).send('Error sending WAV file');
                } else {
                    fs.unlinkSync(outputWavPath); 
                }
            });
        })
        .on('error', err => {
            console.error('Error converting audio:', err);
            res.status(500).send('Error converting audio');
        })
        .save(outputWavPath);
});

// video
app.get('/video', (req, res) => {
    const inputPath = path.join(__dirname, 'media', 'input.mp4');
    const stat = fs.statSync(inputPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
            res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
            return;
        }

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(inputPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(inputPath).pipe(res);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:3000`);
});
