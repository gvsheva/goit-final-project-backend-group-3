import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { TMP_DIRECTORY } from "../config/directories.ts";


if (!fs.existsSync(TMP_DIRECTORY)) {
    fs.mkdirSync(TMP_DIRECTORY, { recursive: true });
}

const allowedMime = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (!allowedMime.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"));
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TMP_DIRECTORY);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const sanitized = base.replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${Date.now()}-${sanitized}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    }
  }
}

export const uploadSingleImage = upload.single("img");
export const uploadMultipleImages = upload.array("images", 10);

export default upload;