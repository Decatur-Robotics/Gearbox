import QRCode from "react-qr-code";

export default function QrCode(props: { value: string }) {
  return <div className="bg-white p-8">
    <QRCode value={props.value} />
  </div>
}