import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { v4 as uuid } from "uuid";
import { CatalogueProductService } from "../../application/services/CatalogueProductService";
import { authMiddleware, AuthenticatedRequest } from "../../../../shared/middlewares/auth.middleware";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import { ValidationError } from "../../../../core/domain/errors/DomainError";

const router = Router();
const service = new CatalogueProductService();
router.use(authMiddleware);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
router.post("/images", (req, res, next) => {
  upload.single("file")(req, res, (error: any) => next(error ? new ValidationError(error.message) : undefined));
}, asyncHandler(async (req, res) => {
  if (!req.file) throw new ValidationError("Choose an image to upload.");
  const bytes = req.file.buffer;
  let extension = "";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) extension = "jpg";
  else if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) extension = "png";
  else if (["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString())) extension = "gif";
  else if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") extension = "webp";
  if (!extension) throw new ValidationError("Supported images: JPEG, PNG, GIF and WebP.");
  const directory = path.resolve(__dirname, "../../../../../uploads/catalogue");
  await fs.mkdir(directory, { recursive: true });
  const filename = `${uuid()}.${extension}`;
  await fs.writeFile(path.join(directory, filename), bytes, { flag: "wx" });
  res.status(201).json({ success: true, data: { url: `/uploads/catalogue/${filename}` } });
}));

router.get("/products", asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await service.list() });
}));
router.post("/products/import", asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (typeof req.body.legacyId !== "string" || !req.body.legacyId || req.body.legacyId.length > 512) throw new ValidationError("Missing legacy product identifier.");
  res.status(201).json({ success: true, data: await service.create(req.body.product, req.user!.sub, req.body.legacyId) });
}));
router.post("/products/bulk-delete", asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!Array.isArray(req.body.ids)) throw new ValidationError("Select products to delete.");
  await service.remove(req.body.ids, req.user!.sub);
  res.json({ success: true });
}));
router.get("/products/:id", asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.get(req.params.id) });
}));
router.post("/products", asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await service.create(req.body, req.user!.sub);
  res.status(201).json({ success: true, data: result.product });
}));
router.put("/products/:id", asyncHandler(async (req: AuthenticatedRequest, res) => {
  res.json({ success: true, data: await service.update(req.params.id, req.body, req.user!.sub) });
}));
router.delete("/products/:id", asyncHandler(async (req: AuthenticatedRequest, res) => {
  await service.remove([req.params.id], req.user!.sub);
  res.json({ success: true });
}));
export default router;
