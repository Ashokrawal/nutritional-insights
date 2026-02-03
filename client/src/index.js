import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux"; // Ensure Redux is wrapped
import { store } from "./redux/store"; // Ensure store is imported
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
