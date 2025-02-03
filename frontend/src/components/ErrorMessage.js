import React from "react";
import styles from "./ErrorMessage.module.css"; // Import CSS module

const ErrorMessage = ({ message }) => {
  if (!message) return null; // Don't render anything if there's no error

  return <p className={styles["error-message"]}>{message}</p>;
};

export default ErrorMessage;
