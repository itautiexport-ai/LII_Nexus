import { Request, Response } from "express";
import { CartonOrderService } from "../../application/services/CartonOrderService";
import { CreateCartonOrderSchema } from "../../application/dto/cartonOrder.dto";

export class CartonOrderController {
  constructor(private service: CartonOrderService) {}

  create = async (req: Request, res: Response) => {
    try {
      const dto = CreateCartonOrderSchema.parse(req.body);
      const cartonOrder = await this.service.create(dto);
      res.status(201).json({ success: true, data: cartonOrder });
    } catch (err: any) {
      if (err.errors) {
        return res.status(400).json({ success: false, errors: err.errors });
      }
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const orders = await this.service.getAll();
      res.json({ success: true, data: orders });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
}
