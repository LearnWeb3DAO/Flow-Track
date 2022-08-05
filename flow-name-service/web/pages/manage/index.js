import * as fcl from "@onflow/fcl";
import Head from "next/head";
import Link from "next/link";
import {useEffect, useState} from "react";
import Navbar from "../../components/Navbar";
import {useAuth} from "../../contexts/AuthContext";
import {getMyDomainInfos} from "../../flow/scripts";
import {initializeAccount} from "../../flow/transactions";
import styles from "../../styles/Manage.module.css";

export default function Home() {
  const { currentUser, isInitialized, checkInit } = useAuth();
  const [domainInfos, setDomainInfos] = useState([]);

  async function initialize() {
    try {
      const txId = await initializeAccount();
      await fcl.tx(txId).onceSealed();
      await checkInit();
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchMyDomains() {
    try {
      const domains = await getMyDomainInfos(currentUser.addr);
      setDomainInfos(domains);
    } catch (error) {
      console.error(error.message);
    }
  }

  useEffect(() => {
    if (isInitialized) {
      fetchMyDomains();
    }
  }, [isInitialized]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Flow Name Service - Manage</title>
        <meta name="description" content="Flow Name Service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className={styles.main}>
        <h1>Your Registered Domains</h1>

        {!isInitialized ? (
          <>
            <p>Your account has not been initialized yet</p>
            <button onClick={initialize}>Initialize Account</button>
          </>
        ) : (
          <div className={styles.domainsContainer}>
            {domainInfos.length === 0 ? (
              <p>You have not registered any FNS Domains yet</p>
            ) : (
              domainInfos.map((di, idx) => (
                <Link href={`/manage/${di.nameHash}`}>
                  <div className={styles.domainInfo} key={idx}>
                    <p>
                      {di.id} - {di.name}
                    </p>
                    <p>Owner: {di.owner}</p>
                    <p>Linked Address: {di.address ? di.address : "None"}</p>
                    <p>Bio: {di.bio ? di.bio : "None"}</p>
                    <p>
                      Created At:{" "}
                      {new Date(
                        parseInt(di.createdAt) * 1000
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      Expires At:{" "}
                      {new Date(
                        parseInt(di.expiresAt) * 1000
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
