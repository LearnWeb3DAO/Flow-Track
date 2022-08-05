import * as fcl from "@onflow/fcl";
import { useEffect, useState } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { checkIsAvailable, getRentCost } from "../flow/scripts";
import { initializeAccount, registerDomain } from "../flow/transactions";
import styles from "../styles/Purchase.module.css";

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export default function Purchase() {
  const { isInitialized, checkInit } = useAuth();
  const [name, setName] = useState("");
  const [years, setYears] = useState(1);
  const [cost, setCost] = useState(0.0);
  const [loading, setLoading] = useState(false);

  async function initialize() {
    try {
      const txId = await initializeAccount();
      await fcl.tx(txId).onceSealed();
      await checkInit();
    } catch (error) {
      console.error(error);
    }
  }

  async function purchase() {
    try {
      setLoading(true);
      const isAvailable = await checkIsAvailable(name);
      if (!isAvailable) throw new Error("Domain is not available");

      if (years <= 0) throw new Error("You must rent for at least 1 year");
      const duration = (years * SECONDS_PER_YEAR).toFixed(1).toString();
      const txId = await registerDomain(name, duration);
      await fcl.tx(txId).onceSealed();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function getCost() {
    if (name.length > 0 && years > 0) {
      const duration = (years * SECONDS_PER_YEAR).toFixed(1).toString();
      const c = await getRentCost(name, duration);
      setCost(c);
    }
  }

  useEffect(() => {
    getCost();
  }, [name, years]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Flow Name Service - Purchase</title>
        <meta name="description" content="Flow Name Service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      {!isInitialized ? (
        <>
          <p>Your account has not been initialized yet</p>
          <button onClick={initialize}>Initialize Account</button>
        </>
      ) : (
        <main className={styles.main}>
          <div className={styles.inputGroup}>
            <span>Name: </span>
            <input
              type="text"
              value={name}
              placeholder="learnweb3"
              onChange={(e) => setName(e.target.value)}
            />
            <span>.fns</span>
          </div>

          <div className={styles.inputGroup}>
            <span>Duration: </span>
            <input
              type="number"
              placeholder="1"
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
            <span>years</span>
          </div>
          <button onClick={purchase}>Purchase</button>
          <p>Cost: {cost} FLOW</p>
          <p>{loading ? "Loading..." : null}</p>
        </main>
      )}
    </div>
  );
}
