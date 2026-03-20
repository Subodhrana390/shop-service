import { Request, Response, NextFunction } from "express";
import qs from "qs";
import { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        const contentType = req.headers["content-type"] || "";

        if (contentType.includes("multipart/form-data")) {
            const parsedBody = qs.parse(req.body);
            schema.parse(parsedBody);
        } else {
            schema.parse(req.body);
        }

        next();
    } catch (error: any) {
        console.error("Validation error:", error);

        const err = new Error("Validation failed") as any;
        err.statusCode = 400;
        err.details = error.errors || [];
        next(err);
    }
};

export const validateQuery = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.query);
        next();
    } catch (error: any) {
        const err = new Error("Query validation failed") as any;
        err.statusCode = 400;
        err.details = error.errors;
        next(err);
    }
};

interface StockNoteParams {
    type: string;
    reason: string;
    quantity: number;
    reference?: string;
    paymentMode?: string;
}

export const generateStockNote = ({
    type,
    reason,
    quantity,
    reference,
    paymentMode,
}: StockNoteParams): string => {
    const absQty = Math.abs(quantity);

    switch (reason) {
        case "sale":
            return (
                `Stock sold: ${absQty} units` +
                `${paymentMode ? ` via ${paymentMode.toUpperCase()}` : ""}` +
                `${reference ? ` (Order: ${reference})` : ""}`
            );
        case "purchase":
            return `Stock added: ${absQty} units purchased${reference ? ` (Invoice: ${reference})` : ""
                }`;
        case "expiry":
            return `Stock removed: ${absQty} units expired`;
        case "damage":
            return `Stock removed: ${absQty} units damaged`;
        case "loss":
            return `Stock removed: ${absQty} units lost`;
        case "transfer_in":
            return `Stock transferred in: ${absQty} units${reference ? ` (Ref: ${reference})` : ""
                }`;
        case "transfer_out":
            return `Stock transferred out: ${absQty} units${reference ? ` (Ref: ${reference})` : ""
                }`;
        case "correction":
            return `Stock adjusted by ${quantity} units (Manual Correction)`;
        case "customer_return":
            return `Customer return: ${absQty} units restocked${reference ? ` (Order: ${reference})` : ""
                }`;
        case "supplier_return":
            return `Supplier return: ${absQty} units removed${reference ? ` (Invoice: ${reference})` : ""
                }`;
        case "opening_stock":
            return `Opening stock added: ${absQty} units`;
        default:
            return `Stock ${type}: ${quantity} units (${reason})${reference ? ` (Ref: ${reference})` : ""
                }`;
    }
};
