// src/app/reportes/page.js
import Report from "./report";
import styles from "./report.module.css";

export default function TransferPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}></h1>
      <Report />
    </div>
  );
}