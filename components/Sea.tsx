/**
 * The water behind the glass: a NOAA blue whale plate (public domain)
 * swimming slowly across, and a smaller one further back. Pure CSS motion;
 * paused with prefers-reduced-motion or the "still" class on <html>.
 */
export function Sea() {
  return (
    <>
      <div className="sea" aria-hidden="true">
        <div className="whale far">
          <img src="/whale.png" alt="" width={1200} height={301} />
        </div>
        <div className="whale near">
          <img src="/whale.png" alt="" width={1200} height={301} />
        </div>
      </div>
    </>
  );
}
