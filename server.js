const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "media");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m3uw7pj.mongodb.net/?retryWrites=true&w=majority`;
// const uri = `mongodb://10.27.27.145:27017`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("database connected");

    // File
    const fileSaveConnection = client.db("seopage").collection("files");

    // File Get
    app.get("/files", async (req, res) => {
      const files = await fileSaveConnection.find().toArray();
      return res.send(files);
    });

    app.post("/files", upload.array("photos"), async (req, res, next) => {
      console.log(req)
      const result = req.files?.map((data) => {
        const field = data?.filename;
        const fileType = data?.mimetype;
        const fileData = fs.readFileSync(`media/${field}`);
        const encodedPic = fileData.toString("base64");
        const imageBuffer = Buffer.from(encodedPic, "base64");
        return {
          imageBuffer,
          fileType,
          field,
        };
      });
      const cursor = await fileSaveConnection.insertMany(result);
      return res.send(cursor);
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello From seopage");
});

// Add CORS middleware to allow requests from the frontend
app.use(cors({
  origin: "http://localhost:3001"
}));

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
