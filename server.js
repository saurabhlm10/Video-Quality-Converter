const express = require("express");
const multer = require("multer");
const path = require("path");
const exec = require("child_process").exec;
const ffmpegPath = require("ffmpeg-static");

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.originalname + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

function convertVideo(inputPath, outputPath, quality) {
  console.log(inputPath, outputPath, quality);
  return new Promise((resolve, reject) => {
    // Modified scale filter to ensure width is divisible by 2
    const command = `${ffmpegPath} -i ${inputPath} -vf scale='trunc(oh*a/2)*2:${quality}' ${outputPath}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject(error);
      }
      resolve(outputPath);
    });
  });
}

app.get("/", (req, res) => res.render("upload"));

app.post("/upload", upload.single("video"), async (req, res) => {
  const originalPath = req.file.path;
  const ext = path.extname(originalPath);
  const basename = path.basename(originalPath, ext);

  const qualities = [144, 1080];
  const convertedFiles = await Promise.all(
    qualities.map((q) =>
      convertVideo(originalPath, `uploads/${basename}_${q}${ext}`, q)
    )
  );

  res.redirect(`/play?files=${convertedFiles.join(",")}`);
});

app.get("/play", (req, res) => {
  const files = req.query.files.split(",");
  res.render("play", { files });
});

app.listen(port, () =>
  console.log(`Server started on http://localhost:${port}`)
);
