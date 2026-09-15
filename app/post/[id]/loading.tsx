import { Spinner } from "@/components/Spinner";

/**
 * Post pages are `force-dynamic`, so navigation can't be served from a
 * prefetched payload and has to wait on the server. Without a loading
 * boundary the router keeps the previous page on screen for that whole
 * round trip, which reads as a dead click on the card you just pressed.
 */
export default function Loading() {
  return (
    <main className="container">
      <div className="center">
        <Spinner label="Loading post" />
      </div>
    </main>
  );
}
