
export default function Home() {
  function accessApp() {
    location.href =
      "https://id.vezham.com/api/oauth/authorize?app=hq&redirect=https://hq.vezham.com"
  }

  return (
    <div className="p-10">
      <h1>HQ Dashboard</h1>
      <button onClick={accessApp}>Access Workspace</button>
    </div>
  )
}
