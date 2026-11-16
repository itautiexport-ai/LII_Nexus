import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { v4 as uuid } from "uuid";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import { ValidationError } from "../../../../core/domain/errors/DomainError";

// Mounted after costing authentication. Images never pass through the JSON parser.
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
router.post("/images", (req, res, next) => {
  upload.single("file")(req, res, (error: any) => next(error ? new ValidationError(
    error.code === "LIMIT_FILE_SIZE" ? "Product image must be 10 MB or smaller." : error.message
  ) : undefined));
}, asyncHandler(async (req, res) => {
  if (!req.file) throw new ValidationError("Choose a product image to upload.");
  const bytes = req.file.buffer;
  let extension = "";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) extension = "jpg";
  else if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) extension = "png";
  else if (["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString())) extension = "gif";
  else if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") extension = "webp";
  if (!extension) throw new ValidationError("Supported product images: JPEG, PNG, GIF and WebP.");
  const directory = path.resolve(__dirname, "../../../../../uploads/costing");
  await fs.mkdir(directory, { recursive: true });
  const filename = `${uuid()}.${extension}`;
  await fs.writeFile(path.join(directory, filename), bytes, { flag: "wx" });
  res.status(201).json({ success: true, data: { url: `/uploads/costing/${filename}` } });
}));
export default router;
