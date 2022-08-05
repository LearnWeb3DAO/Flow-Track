import "../flow/config";
import * as fcl from "@onflow/fcl";
import styles from "../styles/Home.module.css";
import { useEffect, useState } from "react";

const ListingAvailableEventKey =
  "A.4eb8a10cb9f87357.NFTStorefront.ListingAvailable";
const ListingCompletedEventKey =
  "A.4eb8a10cb9f87357.NFTStorefront.ListingCompleted";

export default function Home() {
  const [availableEvents, setAvailableEvents] = useState([]);
  const [completedEvents, setCompletedEvents] = useState([]);
  useEffect(() => {
    fcl.events(ListingAvailableEventKey).subscribe(events => {
      setAvailableEvents(oldEvents => [events, ...oldEvents]);
    });
    fcl.events(ListingCompletedEventKey).subscribe(events => {
      setCompletedEvents(oldEvents => [events, ...oldEvents]);
    });
  }, []);

  return (
    <div className={styles.main}>
      <div>
        <h2>ListingAvailable</h2>
        {availableEvents.length === 0
          ? "No ListingAvailable events tracked yet"
          : availableEvents.map((ae, idx) => (
              <div key={idx} className={styles.info}>
                <p>Storefront: {ae.storefrontAddress}</p>
                <p>Listing Resource ID: {ae.listingResourceID}</p>
                <p>NFT Type: {ae.nftType.typeID}</p>
                <p>NFT ID: {ae.nftID}</p>
                <p>Token Type: {ae.ftVaultType.typeID}</p>
                <p>Price: {ae.price}</p>
              </div>
            ))}
      </div>

      <div>
        <h2>ListingCompleted</h2>
        {completedEvents.length === 0
          ? "No ListingCompleted events tracked yet"
          : completedEvents.map((ce, idx) => (
              <div key={idx} className={styles.info}>
                <p>Storefront Resource ID: {ce.storefrontResourceID}</p>
                <p>Listing Resource ID: {ce.listingResourceID}</p>
                <p>NFT Type: {ce.nftType.typeID}</p>
                <p>NFT ID: {ce.nftID}</p>
              </div>
            ))}
      </div>
    </div>
  );
}
