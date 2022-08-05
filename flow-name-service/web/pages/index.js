import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getAllDomainInfos } from "../flow/scripts";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [domainInfos, setDomainInfos] = useState([]);

  useEffect(() => {
    async function fetchDomains() {
      const domains = await getAllDomainInfos();
      setDomainInfos(domains);
    }

    fetchDomains();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Flow Name Service</title>
        <meta name="description" content="Flow Name Service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className={styles.main}>
        <h1>All Registered Domains</h1>

        <div className={styles.domainsContainer}>
          {domainInfos.length === 0 ? (
            <p>No FNS Domains have been registered yet</p>
          ) : (
            domainInfos.map((di, idx) => (
              <div className={styles.domainInfo} key={idx}>
                <p>
                  {di.id} - {di.name}
                </p>
                <p>Owner: {di.owner}</p>
                <p>Linked Address: {di.address ? di.address : "None"}</p>
                <p>Bio: {di.bio ? di.bio : "None"}</p>
                <p>
                  Created At:{" "}
                  {new Date(parseInt(di.createdAt) * 1000).toLocaleDateString()}
                </p>
                <p>
                  Expires At:{" "}
                  {new Date(parseInt(di.expiresAt) * 1000).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
