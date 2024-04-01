
function Error({statusCode}) {
  return <div className="w-screen h-screen bg-base-300 flex items-center justify-center">
    <div className="card w-5/6 md:w-1/4 bg-base-100 shadow-xl rounded-xl">
      <div className="card-body flex items-center justify-center">
        <img src="/art/BrokenRobotExtra.svg"></img>
        <h1 className="text-8xl font-bold text-error">{statusCode}</h1>
        <h1 className="card-title text-4xl">😔➡️🤖➡️💥</h1>
        <p className="font-mono">Page not found...</p>
        <button className="btn btn-primary btn-lg" onClick={()=>{history.back()}}>Go Back</button>
      </div>
    </div>
  </div>
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
 
export default Error

