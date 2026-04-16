import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { Dashboard } from "./components/Dashboard";
import { Orders } from "./components/Orders";
import { OrderDetails } from "./components/OrderDetails";
import { Inventory } from "./components/Inventory";
import { Analytics } from "./components/Analytics";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "orders", Component: Orders },
      { path: "orders/:orderId", Component: OrderDetails },
      { path: "inventory", Component: Inventory },
      { path: "analytics", Component: Analytics },
    ],
  },
]);
