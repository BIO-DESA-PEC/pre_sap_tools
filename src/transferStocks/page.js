// src/app/transferStocks/page.js
import Transfer from "./transfer";
import styles from "./transfer.module.css";

export default function TransferPage() {
  return (
    <div className={styles.container}>
    
      <Transfer />
    </div>
  );
}