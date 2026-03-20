export const EVENT_TYPES: Record<string, string> = {
  // User Events
  USER_DELETED: "user.deleted",
  USER_SHOP_APPLICATION_APPROVED: "user.shop_application_approved",
  USER_SHOP_OWNER_ROLE_GRANTED: "user.shop_owner_role_granted",

  // Shop Events
  SHOP_CREATED: "shop.created",
  SHOP_UPDATED: "shop.updated",
  SHOP_STATUS_CHANGED: "shop.status_changed",
  SHOP_VERIFIED: "shop.verified",
  SHOP_DELETED: "shop.deleted",

  // Medicine Events
  MEDICINE_CREATED: "medicine.created",
  MEDICINE_UPDATED: "medicine.updated",
  MEDICINE_DISCONTINUED: "medicine.discontinued",
  MEDICINE_RESTOCKED: "medicine.restocked",
  MEDICINE_BULK_IMPORTED: "medicine.bulk_imported",

  // Inventory Events
  INVENTORY_ADDED: "inventory.added",
  INVENTORY_UPDATED: "inventory.updated",
  STOCK_MOVEMENT: "inventory.stock_movement",
  LOW_STOCK_ALERT: "inventory.low_stock_alert",
  EXPIRY_ALERT: "inventory.expiry_alert",
  INVENTORY_BULK_UPDATED: "inventory.bulk_updated",

  // Order Events
  ORDER_PLACED: "order.placed",
  ORDER_CONFIRMED: "order.confirmed",
  ORDER_DELIVERED: "order.delivered",
  ORDER_CANCELLED: "order.cancelled",
};